package com.example.budget.repository;

import com.example.budget.model.Currency;
import com.example.budget.model.ExchangeRate;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.Optional;

public interface ExchangeRateRepository extends JpaRepository<ExchangeRate, Long> {

    Optional<ExchangeRate> findFirstByCurrencyOrderByRateDateDescFetchedAtDesc(Currency currency);

    Optional<ExchangeRate> findByCurrencyAndRateDate(Currency currency, LocalDate rateDate);
}
