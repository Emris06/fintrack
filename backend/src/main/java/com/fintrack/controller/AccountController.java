package com.fintrack.controller;

import com.fintrack.dto.request.AccountRequest;
import com.fintrack.dto.response.AccountResponse;
import com.fintrack.dto.response.ApiResponse;
import com.fintrack.service.AccountService;
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

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/accounts")
@RequiredArgsConstructor
public class AccountController {

    private final AccountService accountService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<AccountResponse>>> getAccounts() {
        Long userId = SecurityUtils.getCurrentUserId();
        List<AccountResponse> result = accountService.getAccounts(userId);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<AccountResponse>> createAccount(@Valid @RequestBody AccountRequest request) {
        Long userId = SecurityUtils.getCurrentUserId();
        AccountResponse result = accountService.createAccount(userId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success("Account created successfully", result));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<AccountResponse>> getAccount(@PathVariable Long id) {
        Long userId = SecurityUtils.getCurrentUserId();
        AccountResponse result = accountService.getAccount(userId, id);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<AccountResponse>> updateAccount(
            @PathVariable Long id,
            @Valid @RequestBody AccountRequest request) {
        Long userId = SecurityUtils.getCurrentUserId();
        AccountResponse result = accountService.updateAccount(userId, id, request);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteAccount(@PathVariable Long id) {
        Long userId = SecurityUtils.getCurrentUserId();
        accountService.deleteAccount(userId, id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/balance-summary")
    public ResponseEntity<ApiResponse<Map<String, BigDecimal>>> getBalanceSummary() {
        Long userId = SecurityUtils.getCurrentUserId();
        Map<String, BigDecimal> result = accountService.getBalanceSummary(userId);
        return ResponseEntity.ok(ApiResponse.success(result));
    }
}
