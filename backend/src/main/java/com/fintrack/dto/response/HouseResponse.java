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
public class HouseResponse {

    private Long id;
    private String houseName;
    private String address;
    private BigDecimal totalDue;
    private int pendingBillsCount;
    private int servicesCount;
    private LocalDateTime createdAt;
}
