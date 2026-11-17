package com.example.budget.dto;

import com.example.budget.model.Brand;
import com.example.budget.model.Currency;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.math.BigDecimal;
import java.util.Set;

/**
 * Запит на підбір збірок: бюджет у UAH/USD/EUR та обрані бренди (NVIDIA, AMD, INTEL, MSI, GIGABYTE).
 * Порожній або відсутній список брендів означає «без обмежень».
 */
public record BuildRequest(
        @NotNull @Positive BigDecimal budget,
        @NotNull Currency currency,
        Set<Brand> brands
) {
}
