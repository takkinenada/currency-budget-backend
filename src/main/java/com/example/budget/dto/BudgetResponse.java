package com.example.budget.dto;

import com.example.budget.model.Budget;
import com.example.budget.model.Currency;

import java.math.BigDecimal;
import java.time.Instant;

public record BudgetResponse(
        Long id,
        String name,
        BigDecimal amount,
        Currency currency,
        Instant createdAt
) {
    public static BudgetResponse from(Budget b) {
        return new BudgetResponse(b.getId(), b.getName(), b.getAmount(), b.getCurrency(), b.getCreatedAt());
    }
}
