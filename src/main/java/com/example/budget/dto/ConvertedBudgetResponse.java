package com.example.budget.dto;

import com.example.budget.model.Currency;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Map;

/**
 * Бюджет, перерахований в усі підтримувані валюти за останніми курсами НБУ.
 */
public record ConvertedBudgetResponse(
        Long id,
        String name,
        BigDecimal originalAmount,
        Currency originalCurrency,
        Map<Currency, BigDecimal> converted,
        LocalDate ratesDate
) {
}
