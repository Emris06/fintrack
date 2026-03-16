package com.fintrack.service;

import com.fintrack.dto.request.TransactionRequest;
import com.fintrack.dto.response.PageResponse;
import com.fintrack.dto.response.TransactionResponse;
import com.fintrack.entity.Account;
import com.fintrack.entity.AuditLog;
import com.fintrack.entity.Category;
import com.fintrack.entity.Transaction;
import com.fintrack.entity.User;
import com.fintrack.entity.enums.AuditAction;
import com.fintrack.entity.enums.TransactionType;
import com.fintrack.exception.InvalidOperationException;
import com.fintrack.exception.ResourceNotFoundException;
import com.fintrack.repository.AccountRepository;
import com.fintrack.repository.AuditLogRepository;
import com.fintrack.repository.CategoryRepository;
import com.fintrack.repository.TransactionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class TransactionService {

    private final TransactionRepository transactionRepository;
    private final AccountRepository accountRepository;
    private final CategoryRepository categoryRepository;
    private final AuditLogRepository auditLogRepository;

    /**
     * Retrieves a paginated, filtered list of transactions for a user.
     * Defaults dateFrom to 30 days ago and dateTo to today when not provided.
     */
    @Transactional(readOnly = true)
    public PageResponse<TransactionResponse> getTransactions(Long userId,
                                                              TransactionType type,
                                                              Long accountId,
                                                              Long categoryId,
                                                              LocalDate dateFrom,
                                                              LocalDate dateTo,
                                                              int page,
                                                              int size) {
        LocalDate effectiveDateFrom = dateFrom != null ? dateFrom : LocalDate.now().minusDays(30);
        LocalDate effectiveDateTo = dateTo != null ? dateTo : LocalDate.now();

        PageRequest pageRequest = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "transactionDate", "createdAt"));

        Page<Transaction> transactionPage = transactionRepository.findWithFilters(
                userId, type, accountId, categoryId, effectiveDateFrom, effectiveDateTo, pageRequest);

        List<TransactionResponse> content = transactionPage.getContent().stream()
                .map(this::mapToResponse)
                .toList();

        return PageResponse.of(content, page, size, transactionPage.getTotalElements());
    }

    /**
     * Retrieves a single transaction by ID, ensuring it belongs to the user and is not deleted.
     */
    @Transactional(readOnly = true)
    public TransactionResponse getTransaction(Long userId, Long transactionId) {
        Transaction transaction = transactionRepository.findByIdAndUserIdAndIsDeletedFalse(transactionId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Transaction", "id", transactionId));

        return mapToResponse(transaction);
    }

    /**
     * Creates a new INCOME or EXPENSE transaction.
     * TRANSFER_IN and TRANSFER_OUT types are not permitted through this endpoint;
     * use TransferService instead.
     *
     * Adjusts the associated account balance atomically:
     *   - EXPENSE: debits the account
     *   - INCOME: credits the account
     *
     * Optimistic locking on the Account entity guards against concurrent balance modifications.
     */
    public TransactionResponse createTransaction(Long userId, TransactionRequest request) {
        validateNonTransferType(request.getType());

        Account account = accountRepository.findByIdAndUserId(request.getAccountId(), userId)
                .orElseThrow(() -> new ResourceNotFoundException("Account", "id", request.getAccountId()));

        Category category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Category", "id", request.getCategoryId()));

        // Apply balance effect
        applyBalanceEffect(account, request.getType(), request.getAmount());

        Transaction transaction = Transaction.builder()
                .user(User.builder().id(userId).build())
                .account(account)
                .category(category)
                .type(request.getType())
                .amount(request.getAmount())
                .description(request.getDescription())
                .note(request.getNote())
                .transactionDate(request.getTransactionDate())
                .build();

        transaction = transactionRepository.save(transaction);
        accountRepository.save(account);

        createAuditLog(userId, "Transaction", transaction.getId(), AuditAction.CREATE, null, describeTransaction(transaction));
        log.info("Created {} transaction id={} for userId={}, amount={}, accountId={}",
                request.getType(), transaction.getId(), userId, request.getAmount(), account.getId());

        return mapToResponse(transaction);
    }

    /**
     * Updates an existing transaction. Reverses the old balance effect and applies the new one,
     * ensuring the account balance stays consistent even when the amount, type, or account changes.
     */
    public TransactionResponse updateTransaction(Long userId, Long transactionId, TransactionRequest request) {
        validateNonTransferType(request.getType());

        Transaction transaction = transactionRepository.findByIdAndUserIdAndIsDeletedFalse(transactionId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Transaction", "id", transactionId));

        Account oldAccount = transaction.getAccount();
        String oldValue = describeTransaction(transaction);

        // Reverse the old balance effect on the original account
        reverseBalanceEffect(oldAccount, transaction.getType(), transaction.getAmount());

        boolean accountChanged = !oldAccount.getId().equals(request.getAccountId());
        Account newAccount;

        if (accountChanged) {
            newAccount = accountRepository.findByIdAndUserId(request.getAccountId(), userId)
                    .orElseThrow(() -> new ResourceNotFoundException("Account", "id", request.getAccountId()));
        } else {
            newAccount = oldAccount;
        }

        // Apply the new balance effect on the (possibly different) account
        applyBalanceEffect(newAccount, request.getType(), request.getAmount());

        Category category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Category", "id", request.getCategoryId()));

        // Update transaction fields
        transaction.setAccount(newAccount);
        transaction.setCategory(category);
        transaction.setType(request.getType());
        transaction.setAmount(request.getAmount());
        transaction.setDescription(request.getDescription());
        transaction.setNote(request.getNote());
        transaction.setTransactionDate(request.getTransactionDate());

        transaction = transactionRepository.save(transaction);
        accountRepository.save(newAccount);
        if (accountChanged) {
            accountRepository.save(oldAccount);
        }

        createAuditLog(userId, "Transaction", transaction.getId(), AuditAction.UPDATE, oldValue, describeTransaction(transaction));
        log.info("Updated transaction id={} for userId={}", transactionId, userId);

        return mapToResponse(transaction);
    }

    /**
     * Soft-deletes a transaction and reverses its balance effect on the associated account.
     */
    public void deleteTransaction(Long userId, Long transactionId) {
        Transaction transaction = transactionRepository.findByIdAndUserIdAndIsDeletedFalse(transactionId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Transaction", "id", transactionId));

        Account account = transaction.getAccount();

        // Reverse balance effect
        reverseBalanceEffect(account, transaction.getType(), transaction.getAmount());

        transaction.setIsDeleted(true);

        transactionRepository.save(transaction);
        accountRepository.save(account);

        createAuditLog(userId, "Transaction", transaction.getId(), AuditAction.DELETE, describeTransaction(transaction), null);
        log.info("Deleted transaction id={} for userId={}, reversed {} of {}",
                transactionId, userId, transaction.getType(), transaction.getAmount());
    }

    // ---------------------------------------------------------------------------
    // Private helpers
    // ---------------------------------------------------------------------------

    /**
     * Validates that the transaction type is INCOME or EXPENSE.
     * Transfer types must go through TransferService.
     */
    private void validateNonTransferType(TransactionType type) {
        if (type == TransactionType.TRANSFER_IN || type == TransactionType.TRANSFER_OUT) {
            throw new InvalidOperationException(
                    "Transfer transactions cannot be created directly. Use the transfer endpoint instead.");
        }
    }

    /**
     * Applies the balance effect of a transaction to the account.
     */
    private void applyBalanceEffect(Account account, TransactionType type, BigDecimal amount) {
        switch (type) {
            case EXPENSE -> account.debit(amount);
            case INCOME -> account.credit(amount);
            default -> throw new InvalidOperationException("Unsupported transaction type: " + type);
        }
    }

    /**
     * Reverses the balance effect of a transaction on the account.
     */
    private void reverseBalanceEffect(Account account, TransactionType type, BigDecimal amount) {
        switch (type) {
            case EXPENSE -> account.credit(amount);
            case INCOME -> account.debit(amount);
            default -> throw new InvalidOperationException("Unsupported transaction type for reversal: " + type);
        }
    }

    private TransactionResponse mapToResponse(Transaction tx) {
        return TransactionResponse.builder()
                .id(tx.getId())
                .accountId(tx.getAccount().getId())
                .accountName(tx.getAccount().getName())
                .categoryId(tx.getCategory() != null ? tx.getCategory().getId() : null)
                .categoryName(tx.getCategory() != null ? tx.getCategory().getName() : null)
                .categoryIcon(tx.getCategory() != null ? tx.getCategory().getIcon() : null)
                .categoryColor(tx.getCategory() != null ? tx.getCategory().getColor() : null)
                .type(tx.getType())
                .amount(tx.getAmount())
                .accountCurrency(tx.getAccount().getCurrency())
                .description(tx.getDescription())
                .note(tx.getNote())
                .transactionDate(tx.getTransactionDate())
                .createdAt(tx.getCreatedAt())
                .build();
    }

    private void createAuditLog(Long userId, String entityType, Long entityId,
                                AuditAction action, String oldValue, String newValue) {
        AuditLog auditLog = AuditLog.builder()
                .userId(userId)
                .entityType(entityType)
                .entityId(entityId)
                .action(action)
                .oldValue(oldValue)
                .newValue(newValue)
                .build();
        auditLogRepository.save(auditLog);
    }

    /**
     * Produces a concise human-readable description of a transaction for audit logging.
     */
    private String describeTransaction(Transaction tx) {
        return String.format("type=%s, amount=%s, accountId=%d, categoryId=%s, date=%s",
                tx.getType(), tx.getAmount(), tx.getAccount().getId(),
                tx.getCategory() != null ? tx.getCategory().getId() : "null",
                tx.getTransactionDate());
    }
}
