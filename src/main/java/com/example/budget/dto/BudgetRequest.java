package com.example.budget.dto;

import com.example.budget.model.Currency;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record BudgetRequest(
        @NotBlank @Size(max = 120) String name,
        @NotNull @DecimalMin("0.00") BigDecimal amount,
        @NotNull Currency currency
) {
}
