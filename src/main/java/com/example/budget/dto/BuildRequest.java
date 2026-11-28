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
    // Конструктор для 3 аргументів (щоб старі тести/виклики не ламалися)
    public BuildRequest(BigDecimal budget, Currency currency, Set<Brand> brands) {
        this(budget, currency, brands, BuildScenario.GAMING);
    }

    public BuildRequest {
        if (scenario == null) {
            scenario = BuildScenario.GAMING;
        }
    }
}