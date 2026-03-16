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
public class FineResponse {

    private Long id;
    private Long carId;
    private String violationType;
    private BigDecimal amount;
    private String fineDate;
    private String status;
    private LocalDateTime paidAt;
    private LocalDateTime createdAt;
}
