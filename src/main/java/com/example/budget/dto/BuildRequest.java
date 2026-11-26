package com.example.budget.dto;

import com.example.budget.build.BuildScenario;
import com.example.budget.model.Brand;
import com.example.budget.model.Currency;

import java.math.BigDecimal;
import java.util.Set;

public record BuildRequest(
        BigDecimal budget,
        Currency currency,
        Set<Brand> brands,
        BuildScenario scenario
) {
    public BuildRequest {
        if (scenario == null) {
            scenario = BuildScenario.GAMING; // Значення за замовчуванням
        }
    }
}