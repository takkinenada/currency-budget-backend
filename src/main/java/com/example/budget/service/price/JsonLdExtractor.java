package com.example.budget.service.price;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.Optional;

@Component
public class JsonLdExtractor {

    private final ObjectMapper objectMapper;

    public JsonLdExtractor(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    public Optional<StorePriceClient.ParsedOffer> extractProductOffer(Document doc, String fallbackUrl) {
        for (Element script : doc.select("script[type=application/ld+json]")) {
            try {
                JsonNode root = objectMapper.readTree(script.data());
                Optional<StorePriceClient.ParsedOffer> found = findProductNode(root, fallbackUrl);
                if (found.isPresent()) {
                    return found;
                }
            } catch (Exception ignored) {
                // Пропускаємо інші JSON-LD блоки
            }
        }
        return Optional.empty();
    }

    private Optional<StorePriceClient.ParsedOffer> findProductNode(JsonNode node, String fallbackUrl) {
        if (node == null) return Optional.empty();
        if (node.isArray()) {
            for (JsonNode item : node) {
                Optional<StorePriceClient.ParsedOffer> res = findProductNode(item, fallbackUrl);
                if (res.isPresent()) return res;
            }
            return Optional.empty();
        }
        if ("Product".equalsIgnoreCase(node.path("@type").asText())) {
            JsonNode offers = node.path("offers");
            if (offers.isArray() && !offers.isEmpty()) {
                offers = offers.get(0);
            }
            String priceStr = offers.path("price").asText("").replaceAll("[^0-9.]", "");
            if (priceStr.isBlank()) return Optional.empty();

            BigDecimal price = new BigDecimal(priceStr);
            String availability = offers.path("availability").asText("");
            boolean inStock = availability.contains("InStock")
                    || availability.contains("OnlineOnly")
                    || availability.contains("LimitedAvailability");
            String url = offers.path("url").asText(fallbackUrl);
            String sku = node.path("sku").asText(null);
            return Optional.of(new StorePriceClient.ParsedOffer(price, inStock, url, sku));
        }
        if (node.has("@graph")) {
            return findProductNode(node.get("@graph"), fallbackUrl);
        }
        return Optional.empty();
    }
}