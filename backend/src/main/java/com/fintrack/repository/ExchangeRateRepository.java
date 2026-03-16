package com.fintrack.repository;

import com.fintrack.entity.ExchangeRate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ExchangeRateRepository extends JpaRepository<ExchangeRate, Long> {

    /**
     * Returns the most recently fetched exchange rate for the given currency pair.
     */
    Optional<ExchangeRate> findTopBySourceCurrencyAndTargetCurrencyOrderByFetchedAtDesc(
            String sourceCurrency, String targetCurrency);
}
