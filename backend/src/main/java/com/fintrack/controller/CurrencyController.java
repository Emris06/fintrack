package com.fintrack.controller;

import com.fintrack.dto.response.ApiResponse;
import com.fintrack.service.CurrencyService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/currency")
@RequiredArgsConstructor
public class CurrencyController {

    private final CurrencyService currencyService;

    @GetMapping("/rates")
    public ResponseEntity<ApiResponse<Map<String, BigDecimal>>> getRates() {
        Map<String, BigDecimal> rates = currencyService.getAllRates();
        return ResponseEntity.ok(ApiResponse.success(rates));
    }

    @GetMapping("/convert")
    public ResponseEntity<ApiResponse<BigDecimal>> convert(
            @RequestParam BigDecimal amount,
            @RequestParam String from,
            @RequestParam String to) {
        BigDecimal result = currencyService.convert(amount, from, to);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @GetMapping("/supported")
    public ResponseEntity<ApiResponse<List<String>>> getSupportedCurrencies() {
        List<String> currencies = currencyService.getSupportedCurrencies();
        return ResponseEntity.ok(ApiResponse.success(currencies));
    }
}
