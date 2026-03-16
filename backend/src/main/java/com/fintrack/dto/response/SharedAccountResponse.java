package com.fintrack.dto.response;

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
public class SharedAccountResponse {

    private Long accountId;
    private String accountName;
    private String accountType;
    private String currency;
    private BigDecimal balance;
    private String icon;
    private String color;
    private String ownerName;
    private LocalDateTime sharedAt;
}
