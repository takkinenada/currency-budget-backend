package com.example.budget.dto;

import com.example.budget.model.Currency;

import java.math.BigDecimal;

public record ConversionResponse(
        Currency from,
        Currency to,
        BigDecimal amount,
        BigDecimal result
) {
}
