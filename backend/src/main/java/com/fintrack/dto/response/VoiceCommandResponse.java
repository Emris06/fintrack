package com.fintrack.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VoiceCommandResponse {

    private String message;
    private String intent;
    private boolean requiresConfirmation;
    private String pendingActionId;
    private Map<String, Object> parsedData;
    private Map<String, Object> resultData;
    private String navigateTo;
}
