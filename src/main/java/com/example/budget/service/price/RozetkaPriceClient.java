package com.example.budget.service.price;

import com.example.budget.model.StoreType;
import com.fasterxml.jackson.databind.JsonNode;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.math.BigDecimal;
import java.util.Optional;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Component
public class RozetkaPriceClient implements StorePriceClient {

    private static final Logger log = LoggerFactory.getLogger(RozetkaPriceClient.class);
    private static final Pattern ROZETKA_ID_PATTERN = Pattern.compile("/p(\\d+)");
    private static final String USER_AGENT =
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36";

    private final RestClient restClient;
    private final JsonLdExtractor jsonLdExtractor;

    public RozetkaPriceClient(RestClient.Builder restClientBuilder, JsonLdExtractor jsonLdExtractor) {
        this.restClient = restClientBuilder
                .defaultHeader(HttpHeaders.USER_AGENT, USER_AGENT)
                .defaultHeader(HttpHeaders.ACCEPT_LANGUAGE, "uk-UA,uk;q=0.9")
                .build();
        this.jsonLdExtractor = jsonLdExtractor;
    }

    @Override
    public StoreType supportedStore() {
        return StoreType.ROZETKA;
    }

    @Override
    public Optional<ParsedOffer> fetchOffer(String productUrl, String externalId) {
        String id = externalId != null ? externalId : extractIdFromUrl(productUrl);
        if (id != null) {
            Optional<ParsedOffer> apiResult = fetchViaApi(id, productUrl);
            if (apiResult.isPresent()) {
                return apiResult;
            }
        }
        return fetchViaHtml(productUrl, id);
    }

    private Optional<ParsedOffer> fetchViaApi(String productId, String fallbackUrl) {
        try {
            JsonNode root = restClient.get()
                    .uri("https://rozetka.com.ua/api/product-api/v4/get-main?front-type=xl&country=UA&lang=ua&id={id}", productId)
                    .retrieve()
                    .body(JsonNode.class);

            JsonNode data = root != null ? root.path("data") : null;
            if (data == null || data.isMissingNode()) return Optional.empty();

            BigDecimal price = new BigDecimal(data.path("price").asText("0"));
            if (price.compareTo(BigDecimal.ZERO) <= 0) return Optional.empty();

            String sellStatus = data.path("sell_status").asText("");
            boolean inStock = "available".equalsIgnoreCase(sellStatus) || "limited".equalsIgnoreCase(sellStatus);
            String href = data.path("href").asText(fallbackUrl);

            return Optional.of(new ParsedOffer(price, inStock, href, productId));
        } catch (Exception e) {
            log.debug("Rozetka API недоступне для id={}: {}", productId, e.getMessage());
            return Optional.empty();
        }
    }

    private Optional<ParsedOffer> fetchViaHtml(String productUrl, String id) {
        try {
            Document doc = Jsoup.connect(productUrl)
                    .userAgent(USER_AGENT)
                    .header("Accept-Language", "uk-UA,uk;q=0.9")
                    .timeout(10_000)
                    .get();
            return jsonLdExtractor.extractProductOffer(doc, productUrl)
                    .map(o -> new ParsedOffer(o.priceUah(), o.inStock(), o.canonicalUrl(), id != null ? id : o.externalId()));
        } catch (Exception e) {
            log.warn("Не вдалося спарсити Rozetka {}: {}", productUrl, e.getMessage());
            return Optional.empty();
        }
    }

    private String extractIdFromUrl(String url) {
        if (url == null) return null;
        Matcher m = ROZETKA_ID_PATTERN.matcher(url);
        return m.find() ? m.group(1) : null;
    }
}