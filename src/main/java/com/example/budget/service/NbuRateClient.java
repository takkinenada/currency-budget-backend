package com.example.budget.service;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.math.BigDecimal;
import java.util.List;

/**
 * Клієнт відкритого API НБУ: https://bank.gov.ua/NBUStatService/v1/statdirectory/exchange?json
 */
@Component
public class NbuRateClient {

    private final RestClient restClient;
    private final String apiUrl;

    public NbuRateClient(RestClient.Builder builder, @Value("${nbu.api-url}") String apiUrl) {
        this.restClient = builder.build();
        this.apiUrl = apiUrl;
    }

    public List<NbuRate> fetchRates() {
        NbuRate[] body = restClient.get()
                .uri(apiUrl)
                .retrieve()
                .body(NbuRate[].class);
        return body == null ? List.of() : List.of(body);
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record NbuRate(
            @JsonProperty("cc") String cc,
            @JsonProperty("rate") BigDecimal rate,
            @JsonProperty("exchangedate") String exchangeDate
    ) {
    }
}
