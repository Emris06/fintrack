package com.fintrack.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class VoiceConfirmRequest {

    @NotBlank(message = "Pending action ID is required")
    private String pendingActionId;

    private boolean confirmed;
}
