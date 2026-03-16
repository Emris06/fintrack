package com.fintrack.controller;

import com.fintrack.dto.request.TransferRequest;
import com.fintrack.dto.response.ApiResponse;
import com.fintrack.dto.response.PageResponse;
import com.fintrack.dto.response.TransferResponse;
import com.fintrack.service.TransferService;
import com.fintrack.util.SecurityUtils;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/transfers")
@RequiredArgsConstructor
public class TransferController {

    private final TransferService transferService;

    @PostMapping
    public ResponseEntity<ApiResponse<TransferResponse>> createTransfer(
            @Valid @RequestBody TransferRequest request) {
        Long userId = SecurityUtils.getCurrentUserId();
        TransferResponse result = transferService.createTransfer(userId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success("Transfer created successfully", result));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<TransferResponse>>> getTransfers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Long userId = SecurityUtils.getCurrentUserId();
        PageResponse<TransferResponse> result = transferService.getTransfers(userId, page, size);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<TransferResponse>> getTransfer(@PathVariable Long id) {
        Long userId = SecurityUtils.getCurrentUserId();
        TransferResponse result = transferService.getTransfer(userId, id);
        return ResponseEntity.ok(ApiResponse.success(result));
    }
}
