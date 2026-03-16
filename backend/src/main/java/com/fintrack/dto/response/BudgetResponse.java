package com.fintrack.dto.response;

import com.fintrack.entity.enums.BudgetPeriod;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BudgetResponse {

    private Long id;
    private Long categoryId;
    private String categoryName;
    private String name;
    private BigDecimal amountLimit;
    private String currency;
    private BudgetPeriod periodType;
    private LocalDate startDate;
    private LocalDate endDate;
    private Boolean isActive;
    private BigDecimal spent;
    private BigDecimal remaining;
    private BigDecimal percentUsed;
}
