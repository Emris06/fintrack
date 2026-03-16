package com.fintrack.dto.response;

import com.fintrack.entity.enums.TransactionType;
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
public class TransactionResponse {

    private Long id;
    private Long accountId;
    private String accountName;
    private Long categoryId;
    private String categoryName;
    private String categoryIcon;
    private String categoryColor;
    private TransactionType type;
    private BigDecimal amount;
    private String accountCurrency;
    private String description;
    private String note;
    private LocalDate transactionDate;
    private LocalDateTime createdAt;
}
