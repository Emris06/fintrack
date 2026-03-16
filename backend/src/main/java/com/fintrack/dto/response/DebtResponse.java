package com.fintrack.dto.response;

import com.fintrack.entity.enums.DebtStatus;
import com.fintrack.entity.enums.DebtType;
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
public class DebtResponse {

    private Long id;
    private DebtType type;
    private String personName;
    private BigDecimal amount;
    private String currency;
    private String description;
    private LocalDate dueDate;
    private DebtStatus status;
    private LocalDateTime closedAt;
    private LocalDateTime createdAt;
}
