package com.fintrack.service;

import com.fintrack.dto.request.TransferRequest;
import com.fintrack.dto.response.PageResponse;
import com.fintrack.dto.response.TransferResponse;
import com.fintrack.entity.Account;
import com.fintrack.entity.AuditLog;
import com.fintrack.entity.ExchangeRate;
import com.fintrack.entity.Transaction;
import com.fintrack.entity.TransferRecord;
import com.fintrack.entity.User;
import com.fintrack.entity.enums.AuditAction;
import com.fintrack.entity.enums.TransactionType;
import com.fintrack.exception.InvalidOperationException;
import com.fintrack.exception.ResourceNotFoundException;
import com.fintrack.repository.AccountRepository;
import com.fintrack.repository.AuditLogRepository;
import com.fintrack.repository.ExchangeRateRepository;
import com.fintrack.repository.TransactionRepository;
import com.fintrack.repository.TransferRecordRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class TransferService {

    private final TransferRecordRepository transferRecordRepository;
    private final TransactionRepository transactionRepository;
    private final AccountRepository accountRepository;
    private final ExchangeRateRepository exchangeRateRepository;
    private final AuditLogRepository auditLogRepository;

    /**
     * Creates an inter-account transfer with full ACID guarantees.
     *
     * <p>Supports same-currency and cross-currency transfers. For cross-currency transfers,
     * the exchange rate is fetched from the exchange_rates table and the target amount is
     * computed as {@code sourceAmount * rate} with {@link RoundingMode#HALF_UP} at scale 4.</p>
     *
     * <p>Idempotency is enforced via the {@code idempotencyKey}: if a transfer with the same
     * key already exists, the existing record is returned without creating a duplicate.</p>
     *
     * <p>Within a single database transaction this method:
     * <ol>
     *   <li>Debits the source account</li>
     *   <li>Credits the target account (with the converted amount for cross-currency)</li>
     *   <li>Creates a TRANSFER_OUT transaction on the source account</li>
     *   <li>Creates a TRANSFER_IN transaction on the target account</li>
     *   <li>Creates a TransferRecord linking both transactions</li>
     *   <li>Writes an audit log entry</li>
     * </ol>
     * Optimistic locking on Account entities guards against concurrent balance modifications.</p>
     */
    public TransferResponse createTransfer(Long userId, TransferRequest request) {
        // Idempotency check — return existing transfer if the key has been used
        Optional<TransferRecord> existing = transferRecordRepository.findByIdempotencyKey(request.getIdempotencyKey());
        if (existing.isPresent()) {
            log.info("Idempotent transfer request detected for key={}, returning existing transferId={}",
                    request.getIdempotencyKey(), existing.get().getId());
            return mapToResponse(existing.get());
        }

        // Validate source != target
        if (request.getSourceAccountId().equals(request.getTargetAccountId())) {
            throw new InvalidOperationException("Source and target accounts must be different");
        }

        // Load and validate ownership of both accounts
        Account sourceAccount = accountRepository.findByIdAndUserId(request.getSourceAccountId(), userId)
                .orElseThrow(() -> new ResourceNotFoundException("Account", "id", request.getSourceAccountId()));

        Account targetAccount = accountRepository.findByIdAndUserId(request.getTargetAccountId(), userId)
                .orElseThrow(() -> new ResourceNotFoundException("Account", "id", request.getTargetAccountId()));

        BigDecimal sourceAmount = request.getAmount();
        BigDecimal targetAmount;
        BigDecimal appliedExchangeRate;

        String sourceCurrency = sourceAccount.getCurrency();
        String targetCurrency = targetAccount.getCurrency();

        boolean crossCurrency = !sourceCurrency.equals(targetCurrency);

        if (crossCurrency) {
            ExchangeRate rate = exchangeRateRepository
                    .findTopBySourceCurrencyAndTargetCurrencyOrderByFetchedAtDesc(sourceCurrency, targetCurrency)
                    .orElseThrow(() -> new InvalidOperationException(
                            String.format("Exchange rate not found for %s -> %s", sourceCurrency, targetCurrency)));

            appliedExchangeRate = rate.getRate();
            targetAmount = sourceAmount.multiply(appliedExchangeRate).setScale(4, RoundingMode.HALF_UP);
            log.debug("Cross-currency transfer: {} {} -> {} {} (rate={})",
                    sourceAmount, sourceCurrency, targetAmount, targetCurrency, appliedExchangeRate);
        } else {
            appliedExchangeRate = BigDecimal.ONE;
            targetAmount = sourceAmount;
        }

        // Debit source, credit target
        sourceAccount.debit(sourceAmount);
        targetAccount.credit(targetAmount);

        // Create TRANSFER_OUT transaction on source account
        Transaction outTransaction = Transaction.builder()
                .user(User.builder().id(userId).build())
                .account(sourceAccount)
                .type(TransactionType.TRANSFER_OUT)
                .amount(sourceAmount)
                .description(request.getDescription())
                .transactionDate(request.getTransferDate())
                .build();

        // Create TRANSFER_IN transaction on target account
        Transaction inTransaction = Transaction.builder()
                .user(User.builder().id(userId).build())
                .account(targetAccount)
                .type(TransactionType.TRANSFER_IN)
                .amount(targetAmount)
                .description(request.getDescription())
                .transactionDate(request.getTransferDate())
                .build();

        outTransaction = transactionRepository.save(outTransaction);
        inTransaction = transactionRepository.save(inTransaction);

        // Create the transfer record linking both transactions
        TransferRecord transferRecord = TransferRecord.builder()
                .user(User.builder().id(userId).build())
                .sourceAccount(sourceAccount)
                .targetAccount(targetAccount)
                .sourceAmount(sourceAmount)
                .targetAmount(targetAmount)
                .exchangeRate(appliedExchangeRate)
                .sourceCurrency(sourceCurrency)
                .targetCurrency(targetCurrency)
                .description(request.getDescription())
                .idempotencyKey(request.getIdempotencyKey())
                .sourceTransaction(outTransaction)
                .targetTransaction(inTransaction)
                .transferDate(request.getTransferDate())
                .build();

        transferRecord = transferRecordRepository.save(transferRecord);

        // Persist account balance changes (optimistic locking via @Version)
        accountRepository.save(sourceAccount);
        accountRepository.save(targetAccount);

        // Audit trail
        AuditLog auditLog = AuditLog.builder()
                .userId(userId)
                .entityType("Transfer")
                .entityId(transferRecord.getId())
                .action(AuditAction.TRANSFER)
                .newValue(String.format("sourceAccountId=%d, targetAccountId=%d, sourceAmount=%s %s, targetAmount=%s %s, rate=%s",
                        sourceAccount.getId(), targetAccount.getId(),
                        sourceAmount, sourceCurrency,
                        targetAmount, targetCurrency,
                        appliedExchangeRate))
                .build();
        auditLogRepository.save(auditLog);

        log.info("Created transfer id={} for userId={}: {} {} (account {}) -> {} {} (account {})",
                transferRecord.getId(), userId,
                sourceAmount, sourceCurrency, sourceAccount.getId(),
                targetAmount, targetCurrency, targetAccount.getId());

        return mapToResponse(transferRecord);
    }

    /**
     * Returns a paginated list of transfers for the given user, ordered by most recent first.
     */
    @Transactional(readOnly = true)
    public PageResponse<TransferResponse> getTransfers(Long userId, int page, int size) {
        PageRequest pageRequest = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));

        Page<TransferRecord> transferPage = transferRecordRepository.findByUserId(userId, pageRequest);

        List<TransferResponse> content = transferPage.getContent().stream()
                .map(this::mapToResponse)
                .toList();

        return PageResponse.of(content, page, size, transferPage.getTotalElements());
    }

    /**
     * Retrieves a single transfer by ID, ensuring it belongs to the given user.
     */
    @Transactional(readOnly = true)
    public TransferResponse getTransfer(Long userId, Long transferId) {
        TransferRecord transferRecord = transferRecordRepository.findByIdAndUserId(transferId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Transfer", "id", transferId));

        return mapToResponse(transferRecord);
    }

    // ---------------------------------------------------------------------------
    // Private helpers
    // ---------------------------------------------------------------------------

    private TransferResponse mapToResponse(TransferRecord record) {
        return TransferResponse.builder()
                .id(record.getId())
                .sourceAccountId(record.getSourceAccount().getId())
                .sourceAccountName(record.getSourceAccount().getName())
                .targetAccountId(record.getTargetAccount().getId())
                .targetAccountName(record.getTargetAccount().getName())
                .sourceAmount(record.getSourceAmount())
                .targetAmount(record.getTargetAmount())
                .exchangeRate(record.getExchangeRate())
                .sourceCurrency(record.getSourceCurrency())
                .targetCurrency(record.getTargetCurrency())
                .description(record.getDescription())
                .transferDate(record.getTransferDate())
                .createdAt(record.getCreatedAt())
                .build();
    }
}
