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
public class BillPaymentResponse {

    private Long id;
    private Long billId;
    private Long accountId;
    private String accountName;
    private Long transactionId;
    private BigDecimal amount;
    private LocalDateTime paymentDate;
}
