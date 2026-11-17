package com.example.budget.dto;

import com.example.budget.model.Currency;

import java.math.BigDecimal;
import java.util.List;

public record BuildResultResponse(
        BigDecimal budget,
        Currency currency,
        BigDecimal budgetUah,
        List<BuildResponse> builds
) {
}
