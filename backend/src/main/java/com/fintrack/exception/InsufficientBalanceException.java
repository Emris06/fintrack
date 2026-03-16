package com.fintrack.exception;

import java.math.BigDecimal;

public class InsufficientBalanceException extends RuntimeException {

    private final Long accountId;
    private final BigDecimal currentBalance;
    private final BigDecimal requestedAmount;

    public InsufficientBalanceException(Long accountId, BigDecimal currentBalance,
                                        BigDecimal requestedAmount) {
        super(String.format("Insufficient balance in account %d. Current: %s, Requested: %s",
                accountId, currentBalance, requestedAmount));
        this.accountId = accountId;
        this.currentBalance = currentBalance;
        this.requestedAmount = requestedAmount;
    }

    public InsufficientBalanceException(String message) {
        super(message);
        this.accountId = null;
        this.currentBalance = null;
        this.requestedAmount = null;
    }

    public Long getAccountId() {
        return accountId;
    }

    public BigDecimal getCurrentBalance() {
        return currentBalance;
    }

    public BigDecimal getRequestedAmount() {
        return requestedAmount;
    }
}
