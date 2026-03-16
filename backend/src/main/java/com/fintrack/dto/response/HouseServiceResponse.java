package com.fintrack.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
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
@JsonInclude(JsonInclude.Include.NON_NULL)
public class HouseServiceResponse {

    private Long id;
    private Long houseId;
    private String serviceName;
    private String providerName;
    private String accountNumber;
    private String billingCycle;
    private BigDecimal averageAmount;
    private BigDecimal pendingAmount;
    private int pendingBillsCount;
    private LocalDateTime createdAt;
}
