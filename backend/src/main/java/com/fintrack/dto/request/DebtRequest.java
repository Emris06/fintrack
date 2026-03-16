package com.fintrack.dto.request;

import com.fintrack.entity.enums.DebtType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
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
public class DebtRequest {

    @NotNull(message = "Debt type is required")
    private DebtType type;

    @NotBlank(message = "Person name is required")
    @Size(min = 1, max = 100, message = "Person name must be between 1 and 100 characters")
    private String personName;

    @NotNull(message = "Amount is required")
    @Positive(message = "Amount must be positive")
    private BigDecimal amount;

    @NotBlank(message = "Currency is required")
    @Size(min = 3, max = 3, message = "Currency code must be exactly 3 characters")
    private String currency;

    @Size(max = 255, message = "Description must not exceed 255 characters")
    private String description;

    private LocalDate dueDate;
}
