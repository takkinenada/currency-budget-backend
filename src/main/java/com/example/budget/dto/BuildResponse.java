package com.example.budget.dto;

import com.example.budget.build.BuildProfile;
import com.example.budget.model.ComponentType;
import com.example.budget.model.StoreType;

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
            Long componentId,
            ComponentType type,
            String name,
            String shortSpec,
            String brand,
            StoreType storeName,
            boolean inStock,
            String shopUrl,
            String affiliateUrl,
            BigDecimal price,
            BigDecimal priceUah
    ) {
        public Part(
                ComponentType type,
                String name,
                String shortSpec,
                String brand,
                String shopUrl,
                BigDecimal price,
                BigDecimal priceUah
        ) {
            this(null, type, name, shortSpec, brand, null, true, shopUrl, null, price, priceUah);
        }
    }
}