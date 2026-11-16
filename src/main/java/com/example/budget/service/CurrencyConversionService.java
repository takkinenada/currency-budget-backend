package com.example.budget.service;

import com.example.budget.model.Currency;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;

@Service
public class CurrencyConversionService {

    private final ExchangeRateService rates;

    public CurrencyConversionService(ExchangeRateService rates) {
        this.rates = rates;
    }

    /**
     * Конвертація через гривню: amount * rate(from) / rate(to).
     */
    public BigDecimal convert(BigDecimal amount, Currency from, Currency to) {
        if (from == to) {
            return amount.setScale(2, RoundingMode.HALF_UP);
        }
        BigDecimal inUah = amount.multiply(rates.rateToUah(from));
        return inUah.divide(rates.rateToUah(to), 2, RoundingMode.HALF_UP);
    }
}
