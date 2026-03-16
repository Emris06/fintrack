package com.fintrack.controller;

import com.fintrack.dto.response.AiInsightResponse;
import com.fintrack.dto.response.ApiResponse;
import com.fintrack.dto.response.CategoryResponse;
import com.fintrack.ai.AiService;
import com.fintrack.util.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
public class AiController {

    private final AiService aiService;

    @GetMapping("/predict-category")
    public ResponseEntity<ApiResponse<CategoryResponse>> predictCategory(
            @RequestParam String description) {
        Long userId = SecurityUtils.getCurrentUserId();
        CategoryResponse result = aiService.predictCategory(description, userId);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @GetMapping("/anomalies")
    public ResponseEntity<ApiResponse<List<AiInsightResponse>>> detectAnomalies() {
        Long userId = SecurityUtils.getCurrentUserId();
        List<AiInsightResponse> result = aiService.detectAnomalies(userId);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @GetMapping("/insights")
    public ResponseEntity<ApiResponse<List<AiInsightResponse>>> generateInsights() {
        Long userId = SecurityUtils.getCurrentUserId();
        List<AiInsightResponse> result = aiService.generateInsights(userId);
        return ResponseEntity.ok(ApiResponse.success(result));
    }
}
