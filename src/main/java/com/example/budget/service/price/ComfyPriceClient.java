package com.example.budget.service.price;

import com.example.budget.model.StoreType;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
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
public class ComfyPriceClient implements StorePriceClient {

    private static final Logger log = LoggerFactory.getLogger(ComfyPriceClient.class);

    private final StoreHttpFetcher httpFetcher;
    private final ObjectMapper objectMapper;
    private final JsonLdExtractor jsonLdExtractor;

    public ComfyPriceClient(
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
        return StoreType.COMFY;
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
        try {
            String targetUrl = productUrl;
            // Якщо URL порожній або заглушка — будуємо пошуковий URL Comfy
            if (targetUrl == null || !targetUrl.contains("comfy.ua")) {
                String q = extractSearchQuery(productUrl, componentName);
                if (q == null || q.isBlank()) return Optional.empty();
                targetUrl = "https://comfy.ua/ua/search/?q=" + URLEncoder.encode(q, StandardCharsets.UTF_8);
            }

            String html = httpFetcher.get(targetUrl);
            Document doc = Jsoup.parse(html, targetUrl);

            // 1. Якщо це вже пряма сторінка товару (.html), пробуємо Schema.org JSON-LD
            if (targetUrl.endsWith(".html") && !targetUrl.contains("/search/")) {
                Optional<ParsedOffer> direct = jsonLdExtractor.extractProductOffer(doc, targetUrl);
                if (direct.isPresent() && isPriceRealistic(direct.get().priceUah(), referencePrice)) {
                    return direct;
                }
            }

            // 2. Якщо це сторінка пошуку — парсимо товари з window.dataLayer (ecommerce.items)
            Optional<ParsedOffer> searchResult = parseDataLayerItems(html, doc, referencePrice);
            if (searchResult.isPresent()) {
                return searchResult;
            }

            return Optional.empty();
        } catch (Exception e) {
            log.warn("Не вдалося спарсити Comfy {}: {}", productUrl, e.getMessage());
            return Optional.empty();
        }
    }

    private Optional<ParsedOffer> parseDataLayerItems(String html, Document doc, BigDecimal referencePrice) {
        try {
            Matcher m = Pattern.compile("\"items\"\\s*:\\s*\\[").matcher(html);
            if (!m.find()) {
                return Optional.empty();
            }

            int arrayStart = m.end() - 1;
            int depth = 0;
            int arrayEnd = -1;
            for (int i = arrayStart; i < html.length(); i++) {
                char ch = html.charAt(i);
                if (ch == '[') depth++;
                else if (ch == ']') {
                    depth--;
                    if (depth == 0) {
                        arrayEnd = i + 1;
                        break;
                    }
                }
            }
            if (arrayEnd == -1) return Optional.empty();

            String jsonArray = html.substring(arrayStart, arrayEnd);
            JsonNode items = objectMapper.readTree(jsonArray);
            if (!items.isArray() || items.isEmpty()) return Optional.empty();

            for (JsonNode item : items) {
                BigDecimal price = parsePositivePrice(item.path("price").asText("0"));
                if (price == null || !isPriceRealistic(price, referencePrice)) {
                    continue;
                }
                String itemId = item.path("item_id").asText("");

                // Шукаємо посилання на цей товар у DOM
                String productUrl = null;
                if (!itemId.isBlank()) {
                    Element link = doc.selectFirst("a[href*='" + itemId + ".html']");
                    if (link != null) {
                        productUrl = link.absUrl("href");
                    }
                }
                if (productUrl == null || productUrl.isBlank()) {
                    for (Element link : doc.select("a[href$=.html]")) {
                        String href = link.absUrl("href");
                        if (href.startsWith("https://comfy.ua/ua/")
                                && !href.contains("/shops.html")
                                && !href.contains("/landing/")) {
                            productUrl = href;
                            break;
                        }
                    }
                }

                if (productUrl != null && !productUrl.isBlank()) {
                    return Optional.of(new ParsedOffer(price, true, productUrl, itemId));
                }
            }
            return Optional.empty();
        } catch (Exception e) {
            log.debug("Помилка розбору Comfy dataLayer: {}", e.getMessage());
            return Optional.empty();
        }
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
        return ratio >= 0.20;
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