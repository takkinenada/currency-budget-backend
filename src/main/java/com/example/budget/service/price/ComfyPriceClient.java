package com.example.budget.service.price;

import com.example.budget.model.StoreType;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.util.Optional;

@Component
public class ComfyPriceClient implements StorePriceClient {

    private static final Logger log = LoggerFactory.getLogger(ComfyPriceClient.class);
    private static final String USER_AGENT =
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36";

    private final JsonLdExtractor jsonLdExtractor;

    public ComfyPriceClient(JsonLdExtractor jsonLdExtractor) {
        this.jsonLdExtractor = jsonLdExtractor;
    }

    @Override
    public StoreType supportedStore() {
        return StoreType.COMFY;
    }

    @Override
    public Optional<ParsedOffer> fetchOffer(String productUrl, String externalId) {
        try {
            Document doc = Jsoup.connect(productUrl)
                    .userAgent(USER_AGENT)
                    .header("Accept-Language", "uk-UA,uk;q=0.9")
                    .timeout(10_000)
                    .get();

            return jsonLdExtractor.extractProductOffer(doc, productUrl);
        } catch (Exception e) {
            log.warn("Не вдалося спарсити Comfy {}: {}", productUrl, e.getMessage());
            return Optional.empty();
        }
    }
}