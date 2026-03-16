package com.fintrack.dto.request;

import com.fintrack.entity.enums.BillingCycle;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HouseServiceRequest {

    @NotBlank(message = "Service name is required")
    @Size(max = 100, message = "Service name must not exceed 100 characters")
    private String serviceName;

    @Size(max = 100, message = "Provider name must not exceed 100 characters")
    private String providerName;

    @Size(max = 100, message = "Account number must not exceed 100 characters")
    private String accountNumber;

    private BillingCycle billingCycle;

    private BigDecimal averageAmount;
}
