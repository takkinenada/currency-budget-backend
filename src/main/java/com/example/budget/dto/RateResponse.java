package com.example.budget.dto;

import com.example.budget.model.Currency;
import com.example.budget.model.ExchangeRate;

import java.math.BigDecimal;
import java.time.LocalDate;

public record RateResponse(Currency currency, BigDecimal rateToUah, LocalDate rateDate) {

    public static RateResponse from(ExchangeRate r) {
        return new RateResponse(r.getCurrency(), r.getRateToUah(), r.getRateDate());
    }
}
