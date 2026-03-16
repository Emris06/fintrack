package com.fintrack.dto.response;

import com.fintrack.entity.enums.AccountType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AccountResponse {

    private Long id;
    private String name;
    private AccountType type;
    private String currency;
    private BigDecimal balance;
    private BigDecimal initialBalance;
    private String icon;
    private String color;
    private Boolean isActive;
    private LocalDateTime createdAt;
}
