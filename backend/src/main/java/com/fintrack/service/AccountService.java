package com.fintrack.service;

import com.fintrack.dto.request.AccountRequest;
import com.fintrack.dto.response.AccountResponse;
import com.fintrack.entity.Account;
import com.fintrack.entity.AuditLog;
import com.fintrack.entity.User;
import com.fintrack.entity.enums.AuditAction;
import com.fintrack.exception.ResourceNotFoundException;
import com.fintrack.repository.AccountRepository;
import com.fintrack.repository.AuditLogRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@Transactional
@Slf4j
@RequiredArgsConstructor
public class AccountService {

    private final AccountRepository accountRepository;
    private final AuditLogRepository auditLogRepository;

    /**
     * Retrieve all active accounts for a given user.
     *
     * @param userId the owner's user id
     * @return list of AccountResponse DTOs
     */
    @Transactional(readOnly = true)
    public List<AccountResponse> getAccounts(Long userId) {
        log.debug("Fetching all active accounts for user id: {}", userId);

        return accountRepository.findByUserIdAndIsActiveTrue(userId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    /**
     * Retrieve a single account by id, ensuring it belongs to the specified user.
     *
     * @param userId    the owner's user id
     * @param accountId the account id
     * @return AccountResponse DTO
     */
    @Transactional(readOnly = true)
    public AccountResponse getAccount(Long userId, Long accountId) {
        log.debug("Fetching account id: {} for user id: {}", accountId, userId);

        Account account = findAccountByIdAndUserId(accountId, userId);
        return mapToResponse(account);
    }

    /**
     * Create a new account for the specified user.
     *
     * @param userId  the owner's user id
     * @param request the account creation details
     * @return AccountResponse DTO of the newly created account
     */
    public AccountResponse createAccount(Long userId, AccountRequest request) {
        log.info("Creating new account '{}' for user id: {}", request.getName(), userId);

        BigDecimal initialBalance = request.getInitialBalance() != null
                ? request.getInitialBalance()
                : BigDecimal.ZERO;

        Account account = Account.builder()
                .user(User.builder().id(userId).build())
                .name(request.getName())
                .type(request.getType())
                .currency(request.getCurrency())
                .initialBalance(initialBalance)
                .balance(initialBalance)
                .icon(request.getIcon())
                .color(request.getColor())
                .build();

        account = accountRepository.save(account);

        log.info("Account created with id: {} for user id: {}", account.getId(), userId);

        createAuditLog(userId, "Account", account.getId(), AuditAction.CREATE, null, account.getName());

        return mapToResponse(account);
    }

    /**
     * Update mutable fields of an existing account (name, icon, color only).
     * Balance, currency, and type are immutable after creation.
     *
     * @param userId    the owner's user id
     * @param accountId the account id to update
     * @param request   the update details
     * @return AccountResponse DTO of the updated account
     */
    public AccountResponse updateAccount(Long userId, Long accountId, AccountRequest request) {
        log.info("Updating account id: {} for user id: {}", accountId, userId);

        Account account = findAccountByIdAndUserId(accountId, userId);

        String oldValue = account.getName();

        account.setName(request.getName());
        account.setIcon(request.getIcon());
        account.setColor(request.getColor());

        account = accountRepository.save(account);

        log.info("Account id: {} updated successfully", accountId);

        createAuditLog(userId, "Account", account.getId(), AuditAction.UPDATE, oldValue, account.getName());

        return mapToResponse(account);
    }

    /**
     * Soft-delete an account by marking it as inactive.
     *
     * @param userId    the owner's user id
     * @param accountId the account id to delete
     */
    public void deleteAccount(Long userId, Long accountId) {
        log.info("Soft-deleting account id: {} for user id: {}", accountId, userId);

        Account account = findAccountByIdAndUserId(accountId, userId);

        account.setIsActive(false);
        accountRepository.save(account);

        log.info("Account id: {} soft-deleted successfully", accountId);

        createAuditLog(userId, "Account", accountId, AuditAction.DELETE, account.getName(), null);
    }

    /**
     * Calculate the total balance across all active accounts for a user, grouped by currency.
     *
     * @param userId the owner's user id
     * @return map of currency code to total balance
     */
    @Transactional(readOnly = true)
    public Map<String, BigDecimal> getBalanceSummary(Long userId) {
        log.debug("Calculating balance summary for user id: {}", userId);

        List<Object[]> results = accountRepository.sumBalancesByUserIdGroupedByCurrency(userId);

        Map<String, BigDecimal> summary = new HashMap<>();
        for (Object[] row : results) {
            String currency = (String) row[0];
            BigDecimal totalBalance = (BigDecimal) row[1];
            summary.put(currency, totalBalance);
        }

        return summary;
    }

    private AccountResponse mapToResponse(Account account) {
        return AccountResponse.builder()
                .id(account.getId())
                .name(account.getName())
                .type(account.getType())
                .currency(account.getCurrency())
                .balance(account.getBalance())
                .initialBalance(account.getInitialBalance())
                .icon(account.getIcon())
                .color(account.getColor())
                .isActive(account.getIsActive())
                .createdAt(account.getCreatedAt())
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
        log.debug("Audit log created: {} {} for entity {} id: {}", action, entityType, entityType, entityId);
    }

    private Account findAccountByIdAndUserId(Long accountId, Long userId) {
        return accountRepository.findByIdAndUserId(accountId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Account", "id", accountId));
    }
}
