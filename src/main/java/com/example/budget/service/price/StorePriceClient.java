package com.example.budget.service.price;

import com.example.budget.model.StoreType;
import java.math.BigDecimal;
import java.util.Optional;

public interface StorePriceClient {

    StoreType supportedStore();

    Optional<ParsedOffer> fetchOffer(String productUrl, String externalId);

    record ParsedOffer(
            BigDecimal priceUah,
            boolean inStock,
            String canonicalUrl,
            String externalId
    ) {}
}