package com.fintrack.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class VoiceCommandRequest {

    @NotBlank(message = "Command text is required")
    @Size(max = 1000, message = "Command text must not exceed 1000 characters")
    private String text;
}
