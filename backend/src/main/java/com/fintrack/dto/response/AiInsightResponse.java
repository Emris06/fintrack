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
public class AiInsightResponse {

    private String type;
    private String title;
    private String message;
    private String severity;
    private Map<String, Object> data;
}
