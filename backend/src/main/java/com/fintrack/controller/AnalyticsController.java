package com.fintrack.controller;

import com.fintrack.dto.response.AnalyticsSummaryResponse;
import com.fintrack.dto.response.ApiResponse;
import com.fintrack.dto.response.CategoryBreakdownResponse;
import com.fintrack.dto.response.CategoryComparisonResponse;
import com.fintrack.dto.response.TrendDataResponse;
import com.fintrack.service.AnalyticsService;
import com.fintrack.util.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/analytics")
@RequiredArgsConstructor
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    @GetMapping("/summary")
    public ResponseEntity<ApiResponse<AnalyticsSummaryResponse>> getSummary(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateFrom,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateTo) {
        Long userId = SecurityUtils.getCurrentUserId();
        AnalyticsSummaryResponse result = analyticsService.getSummary(userId, dateFrom, dateTo);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @GetMapping("/category-breakdown")
    public ResponseEntity<ApiResponse<List<CategoryBreakdownResponse>>> getCategoryBreakdown(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateFrom,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateTo) {
        Long userId = SecurityUtils.getCurrentUserId();
        List<CategoryBreakdownResponse> result = analyticsService.getCategoryBreakdown(userId, dateFrom, dateTo);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @GetMapping("/trend")
    public ResponseEntity<ApiResponse<TrendDataResponse>> getTrend(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateFrom,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateTo,
            @RequestParam(required = false, defaultValue = "MONTHLY") String granularity) {
        Long userId = SecurityUtils.getCurrentUserId();
        TrendDataResponse result = analyticsService.getTrend(userId, dateFrom, dateTo, granularity);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @GetMapping("/category-comparison")
    public ResponseEntity<ApiResponse<List<CategoryComparisonResponse>>> getCategoryComparison(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateFrom,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateTo) {
        Long userId = SecurityUtils.getCurrentUserId();
        List<CategoryComparisonResponse> result = analyticsService.getCategoryComparison(userId, dateFrom, dateTo);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @GetMapping("/calendar")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getCalendarData(
            @RequestParam(required = false) Integer year,
            @RequestParam(required = false) Integer month) {
        Long userId = SecurityUtils.getCurrentUserId();
        Map<String, Object> result = analyticsService.getCalendarData(userId, year, month);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @GetMapping("/savings-rate")
    public ResponseEntity<ApiResponse<AnalyticsSummaryResponse>> getSavingsRate(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateFrom,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateTo) {
        Long userId = SecurityUtils.getCurrentUserId();
        AnalyticsSummaryResponse result = analyticsService.getSavingsRate(userId, dateFrom, dateTo);
        return ResponseEntity.ok(ApiResponse.success(result));
    }
}
