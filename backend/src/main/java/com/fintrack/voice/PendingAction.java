package com.fintrack.voice;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PendingAction {

    private String id;
    private Long userId;
    private String intent;
    private Map<String, Object> parsedData;
    private String confirmationMessage;
    private Instant createdAt;
}
