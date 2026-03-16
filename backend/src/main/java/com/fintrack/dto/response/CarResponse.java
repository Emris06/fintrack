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
public class CarResponse {

    private Long id;
    private String licensePlate;
    private String registrationCertificate;
    private String nickname;
    private BigDecimal unpaidFinesTotal;
    private int unpaidFinesCount;
    private LocalDateTime createdAt;
}
