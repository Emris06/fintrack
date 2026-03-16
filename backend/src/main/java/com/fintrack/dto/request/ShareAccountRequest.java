package com.fintrack.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ShareAccountRequest {

    @NotNull(message = "Account ID is required")
    private Long accountId;
}
