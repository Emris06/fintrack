package com.fintrack.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
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
@JsonInclude(JsonInclude.Include.NON_NULL)
public class BillResponse {

    private Long id;
    private Long serviceId;
    private String serviceName;
    private BigDecimal amount;
    private LocalDate dueDate;
    private String status;
    private String description;
    private LocalDateTime createdAt;
}
