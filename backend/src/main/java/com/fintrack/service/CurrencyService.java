package com.fintrack.service;

import com.fintrack.entity.ExchangeRate;
import com.fintrack.repository.ExchangeRateRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@Slf4j
@RequiredArgsConstructor
public class CurrencyService {

    private final ExchangeRateRepository exchangeRateRepository;

    private static final List<String> SUPPORTED_CURRENCIES = List.of("USD", "UZS", "RUB");

    /**
     * Convert an amount from one currency to another.
     */
    @Transactional(readOnly = true)
    public BigDecimal convert(BigDecimal amount, String from, String to) {
        if (from.equals(to)) {
            return amount;
        }

        ExchangeRate rate = exchangeRateRepository
                .findTopBySourceCurrencyAndTargetCurrencyOrderByFetchedAtDesc(from, to)
                .orElseThrow(() -> new IllegalArgumentException(
                        String.format("Exchange rate not found for %s -> %s", from, to)));

        return amount.multiply(rate.getRate()).setScale(4, RoundingMode.HALF_UP);
    }

    /**
     * Get all exchange rates as a map of "FROM-TO" -> rate.
     */
    @Transactional(readOnly = true)
    public Map<String, BigDecimal> getAllRates() {
        Map<String, BigDecimal> rates = new HashMap<>();

        for (String from : SUPPORTED_CURRENCIES) {
            for (String to : SUPPORTED_CURRENCIES) {
                exchangeRateRepository
                        .findTopBySourceCurrencyAndTargetCurrencyOrderByFetchedAtDesc(from, to)
                        .ifPresent(rate -> rates.put(from + "-" + to, rate.getRate()));
            }
        }

        return rates;
    }

    /**
     * Get supported currencies list.
     */
    public List<String> getSupportedCurrencies() {
        return SUPPORTED_CURRENCIES;
    }
}
