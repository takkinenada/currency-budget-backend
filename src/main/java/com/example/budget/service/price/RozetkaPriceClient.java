package com.example.budget.service.price;

import com.example.budget.model.StoreType;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.jsoup.Jsoup;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.net.URI;
import java.net.URLDecoder;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.Optional;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Component
public class RozetkaPriceClient implements StorePriceClient {

    private static final Logger log = LoggerFactory.getLogger(RozetkaPriceClient.class);
    private static final Pattern ROZETKA_ID_PATTERN = Pattern.compile("/p(\\d+)");

    private final StoreHttpFetcher httpFetcher;
    private final ObjectMapper objectMapper;
    private final JsonLdExtractor jsonLdExtractor;

    public RozetkaPriceClient(
            StoreHttpFetcher httpFetcher,
            ObjectMapper objectMapper,
            JsonLdExtractor jsonLdExtractor
    ) {
        this.httpFetcher = httpFetcher;
        this.objectMapper = objectMapper;
        this.jsonLdExtractor = jsonLdExtractor;
    }

    @Override
    public StoreType supportedStore() {
        return StoreType.ROZETKA;
    }

    @Override
    public Optional<ParsedOffer> fetchOffer(String productUrl, String externalId) {
        return fetchOffer(productUrl, externalId, null, null);
    }

    @Override
    public Optional<ParsedOffer> fetchOffer(
            String productUrl,
            String externalId,
            String componentName,
            BigDecimal referencePrice
    ) {
        // Якщо вже є числовий ID (наприклад 522346589), одразу беремо актуальну ціну за ID
        String numericId = isNumericId(externalId) ? externalId : extractIdFromUrl(productUrl);
        if (numericId != null) {
            Optional<ParsedOffer> direct = fetchPriceById(numericId, productUrl, referencePrice);
            if (direct.isPresent()) {
                return direct;
            }
        }

        // Якщо ID ще немає (пошуковий URL чи hotline) — шукаємо товар у Rozetka Search API
        String query = extractSearchQuery(productUrl, componentName);
        if (query != null && !query.isBlank()) {
            return searchViaApi(query, referencePrice);
        }
        return Optional.empty();
    }

    private Optional<ParsedOffer> searchViaApi(String query, BigDecimal referencePrice) {
        try {
            String encoded = URLEncoder.encode(query, StandardCharsets.UTF_8);
            String searchUrl = "https://search.rozetka.com.ua/search/api/v6/?front-type=xl&country=UA&lang=ua&text=" + encoded;
            String body = httpFetcher.get(searchUrl);
            JsonNode goods = objectMapper.readTree(body).path("data").path("goods");
            if (!goods.isArray() || goods.isEmpty()) {
                return Optional.empty();
            }

            // Перевіряємо максимум перші 2 товари з видачі
            int limit = Math.min(2, goods.size());
            for (int i = 0; i < limit; i++) {
                String foundId = goods.get(i).path("id").asText("");
                if (!isNumericId(foundId)) continue;

                Optional<ParsedOffer> offer = fetchPriceById(foundId, null, referencePrice);
                if (offer.isPresent()) {
                    return offer;
                }
            }
            return Optional.empty();
        } catch (Exception e) {
            log.warn("Rozetka search помилка для '{}': {}", query, e.getMessage());
            return Optional.empty();
        }
    }

    private Optional<ParsedOffer> fetchPriceById(String productId, String fallbackUrl, BigDecimal referencePrice) {
        try {
            String priceUrl = "https://common-api.rozetka.com.ua/v2/goods/get-price/?id=" + productId;
            String body = httpFetcher.get(priceUrl);
            JsonNode root = objectMapper.readTree(body);
            if (root == null || root.isMissingNode() || root.isNull()) return Optional.empty();

            BigDecimal price = parsePositivePrice(root.path("price").asText("0"));
            if (price == null || !isPriceRealistic(price, referencePrice)) {
                return Optional.empty();
            }

            String sellStatus = root.path("sell_status").asText("");
            boolean inStock = "available".equalsIgnoreCase(sellStatus) || "limited".equalsIgnoreCase(sellStatus);

            String href = (fallbackUrl != null && fallbackUrl.contains("/p" + productId))
                    ? fallbackUrl
                    : "https://rozetka.com.ua/ua/x/p" + productId + "/";

            return Optional.of(new ParsedOffer(price, inStock, href, productId));
        } catch (Exception e) {
            log.warn("Rozetka common-api помилка для id={}: {}", productId, e.getMessage());
            return Optional.empty();
        }
    }

    private static boolean isNumericId(String s) {
        return s != null && !s.isBlank() && s.matches("\\d+");
    }

    private static BigDecimal parsePositivePrice(String raw) {
        String clean = raw.replaceAll("[^0-9.]", "");
        if (clean.isBlank()) return null;
        BigDecimal price = new BigDecimal(clean);
        return price.compareTo(BigDecimal.ZERO) > 0 ? price : null;
    }

    private static boolean isPriceRealistic(BigDecimal found, BigDecimal reference) {
        if (reference == null || reference.compareTo(BigDecimal.ZERO) <= 0) return true;
        double ratio = found.doubleValue() / reference.doubleValue();
        return ratio >= 0.35 && ratio <= 2.8;
    }

    private static String extractIdFromUrl(String url) {
        if (url == null) return null;
        Matcher m = ROZETKA_ID_PATTERN.matcher(url);
        return m.find() ? m.group(1) : null;
    }

    private static String extractSearchQuery(String url, String fallbackName) {
        if (url != null) {
            try {
                String q = URI.create(url).getRawQuery();
                if (q != null) {
                    for (String pair : q.split("&")) {
                        String[] kv = pair.split("=", 2);
                        if (kv.length == 2 && ("q".equals(kv[0]) || "text".equals(kv[0]))) {
                            return URLDecoder.decode(kv[1], StandardCharsets.UTF_8);
                        }
                    }
                }
            } catch (Exception ignored) {
            }
        }
        return fallbackName;
    }
}