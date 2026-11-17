package com.example.budget.dto;

import com.example.budget.build.BuildProfile;
import com.example.budget.model.ComponentType;

import java.math.BigDecimal;
import java.util.List;

public record BuildResponse(
        BuildProfile profile,
        String title,
        String description,
        List<Part> parts,
        BigDecimal totalPrice,
        BigDecimal totalPriceUah,
        double performanceScore,
        double techScore
) {
    /** Комплектуюча в збірці; {@code price} у валюті запиту, {@code priceUah} у гривнях. */
    public record Part(
            ComponentType type,
            String name,
            String shortSpec,
            String brand,
            String shopUrl,
            BigDecimal price,
            BigDecimal priceUah
    ) {
    }
}
