package com.fintrack.controller;

import com.fintrack.dto.request.BudgetRequest;
import com.fintrack.dto.response.ApiResponse;
import com.fintrack.dto.response.BudgetResponse;
import com.fintrack.service.BudgetService;
import com.fintrack.util.SecurityUtils;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/budgets")
@RequiredArgsConstructor
public class BudgetController {

    private final BudgetService budgetService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<BudgetResponse>>> getBudgets() {
        Long userId = SecurityUtils.getCurrentUserId();
        List<BudgetResponse> result = budgetService.getBudgets(userId);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<BudgetResponse>> createBudget(@Valid @RequestBody BudgetRequest request) {
        Long userId = SecurityUtils.getCurrentUserId();
        BudgetResponse result = budgetService.createBudget(userId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success("Budget created successfully", result));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<BudgetResponse>> getBudget(@PathVariable Long id) {
        Long userId = SecurityUtils.getCurrentUserId();
        BudgetResponse result = budgetService.getBudget(userId, id);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<BudgetResponse>> updateBudget(
            @PathVariable Long id,
            @Valid @RequestBody BudgetRequest request) {
        Long userId = SecurityUtils.getCurrentUserId();
        BudgetResponse result = budgetService.updateBudget(userId, id, request);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteBudget(@PathVariable Long id) {
        Long userId = SecurityUtils.getCurrentUserId();
        budgetService.deleteBudget(userId, id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/performance")
    public ResponseEntity<ApiResponse<List<BudgetResponse>>> getBudgetPerformance() {
        Long userId = SecurityUtils.getCurrentUserId();
        List<BudgetResponse> result = budgetService.getBudgetPerformance(userId);
        return ResponseEntity.ok(ApiResponse.success(result));
    }
}
