package com.fintrack.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TransferResponse {

    private Long id;
    private Long sourceAccountId;
    private String sourceAccountName;
    private Long targetAccountId;
    private String targetAccountName;
    private BigDecimal sourceAmount;
    private BigDecimal targetAmount;
    private BigDecimal exchangeRate;
    private String sourceCurrency;
    private String targetCurrency;
    private String description;
    private LocalDate transferDate;
    private LocalDateTime createdAt;
}
