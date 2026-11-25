package com.example.budget.service.price;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Element;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Map;

@Component
public class StoreHttpFetcher {

    private static final String USER_AGENT =
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

    private final HttpClient httpClient = HttpClient.newBuilder()
            .followRedirects(HttpClient.Redirect.NORMAL)
            .connectTimeout(Duration.ofSeconds(15))
            .build();

    private final ObjectMapper objectMapper;

    @Value("${prices.flaresolverr-url:}")
    private String flareSolverrUrl;

    @Value("${prices.scraper-api-key:}")
    private String scraperApiKey;

    public StoreHttpFetcher(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    public String get(String targetUrl) throws IOException, InterruptedException {
        // search.rozetka.com.ua працює без Cloudflare — ходимо напряму за 0.1с
        boolean needsBypass = !targetUrl.contains("search.rozetka.com.ua");

        if (needsBypass && flareSolverrUrl != null && !flareSolverrUrl.isBlank()) {
            return fetchViaFlareSolverr(targetUrl);
        }
        return fetchDirect(targetUrl);
    }

    private String fetchViaFlareSolverr(String targetUrl) throws IOException, InterruptedException {
        String payload = objectMapper.writeValueAsString(Map.of(
                "cmd", "request.get",
                "url", targetUrl,
                "maxTimeout", 60000
        ));

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(flareSolverrUrl.trim()))
                .timeout(Duration.ofSeconds(65))
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(payload))
                .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        if (response.statusCode() >= 400) {
            throw new IOException("FlareSolverr HTTP " + response.statusCode());
        }

        JsonNode root = objectMapper.readTree(response.body());
        if (!"ok".equalsIgnoreCase(root.path("status").asText())) {
            throw new IOException("FlareSolverr помилка: " + root.path("message").asText("unknown"));
        }

        JsonNode solution = root.path("solution");
        int targetStatus = solution.path("status").asInt(200);
        if (targetStatus >= 400) {
            throw new IOException("HTTP " + targetStatus + " від " + targetUrl);
        }

        String body = solution.path("response").asText("");
        // Chrome у FlareSolverr обгортає JSON-відповіді API в <html><body><pre>{...}</pre></body></html>
        if (body.trim().startsWith("<")) {
            Element pre = Jsoup.parse(body).selectFirst("pre");
            if (pre != null) {
                String text = pre.text().trim();
                if (text.startsWith("{") || text.startsWith("[")) {
                    return text;
                }
            }
        }
        return body;
    }

    private String fetchDirect(String targetUrl) throws IOException, InterruptedException {
        String finalUrl = targetUrl;
        if (scraperApiKey != null && !scraperApiKey.isBlank()) {
            finalUrl = "https://api.scraperapi.com/?api_key="
                    + URLEncoder.encode(scraperApiKey.trim(), StandardCharsets.UTF_8)
                    + "&url="
                    + URLEncoder.encode(targetUrl, StandardCharsets.UTF_8);
        }

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(finalUrl))
                .timeout(Duration.ofSeconds(25))
                .header("User-Agent", USER_AGENT)
                .header("Accept", "text/html,application/json;q=0.9,*/*;q=0.8")
                .header("Accept-Language", "uk-UA,uk;q=0.9,en;q=0.8")
                .GET()
                .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        if (response.statusCode() >= 400) {
            throw new IOException("HTTP " + response.statusCode() + " від " + targetUrl);
        }
        return response.body();
    }
}