package com.fintrack.controller;

import com.fintrack.dto.request.DebtRequest;
import com.fintrack.dto.response.ApiResponse;
import com.fintrack.dto.response.DebtResponse;
import com.fintrack.service.DebtService;
import com.fintrack.util.SecurityUtils;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/debts")
@RequiredArgsConstructor
public class DebtController {

    private final DebtService debtService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<DebtResponse>>> getDebts() {
        Long userId = SecurityUtils.getCurrentUserId();
        List<DebtResponse> result = debtService.getDebts(userId);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<DebtResponse>> createDebt(@Valid @RequestBody DebtRequest request) {
        Long userId = SecurityUtils.getCurrentUserId();
        DebtResponse result = debtService.createDebt(userId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success("Debt created successfully", result));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<DebtResponse>> getDebt(@PathVariable Long id) {
        Long userId = SecurityUtils.getCurrentUserId();
        DebtResponse result = debtService.getDebt(userId, id);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<DebtResponse>> updateDebt(
            @PathVariable Long id,
            @Valid @RequestBody DebtRequest request) {
        Long userId = SecurityUtils.getCurrentUserId();
        DebtResponse result = debtService.updateDebt(userId, id, request);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @PatchMapping("/{id}/close")
    public ResponseEntity<ApiResponse<DebtResponse>> closeDebt(@PathVariable Long id) {
        Long userId = SecurityUtils.getCurrentUserId();
        DebtResponse result = debtService.closeDebt(userId, id);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteDebt(@PathVariable Long id) {
        Long userId = SecurityUtils.getCurrentUserId();
        debtService.deleteDebt(userId, id);
        return ResponseEntity.noContent().build();
    }
}
