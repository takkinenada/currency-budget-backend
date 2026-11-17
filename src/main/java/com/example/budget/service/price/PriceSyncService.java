package com.example.budget.service.price;

import com.example.budget.model.ComponentOffer;
import com.example.budget.model.PcComponent;
import com.example.budget.model.StoreType;
import com.example.budget.repository.ComponentOfferRepository;
import com.example.budget.repository.PcComponentRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class PriceSyncService {

    private static final Logger log = LoggerFactory.getLogger(PriceSyncService.class);

    private final ComponentOfferRepository offerRepository;
    private final PcComponentRepository componentRepository;
    private final Map<StoreType, StorePriceClient> clientsByStore;

    @Value("${prices.request-delay-ms:500}")
    private long requestDelayMs;

    public PriceSyncService(
            ComponentOfferRepository offerRepository,
            PcComponentRepository componentRepository,
            List<StorePriceClient> clients
    ) {
        this.offerRepository = offerRepository;
        this.componentRepository = componentRepository;
        this.clientsByStore = clients.stream()
                .collect(Collectors.toMap(StorePriceClient::supportedStore, Function.identity()));
    }

    @Scheduled(cron = "${prices.refresh-cron:0 0 */6 * * *}", zone = "Europe/Kyiv")
    @Transactional
    public SyncReport syncAllPrices() {
        List<ComponentOffer> offers = offerRepository.findAllWithComponent();
        int updated = 0;
        int failed = 0;

        for (ComponentOffer offer : offers) {
            StorePriceClient client = clientsByStore.get(offer.getStoreName());
            if (client == null) {
                continue;
            }
            Optional<StorePriceClient.ParsedOffer> parsedOpt =
                    client.fetchOffer(offer.getProductUrl(), offer.getExternalId());

            if (parsedOpt.isPresent()) {
                StorePriceClient.ParsedOffer parsed = parsedOpt.get();
                offer.setPriceUah(parsed.priceUah());
                offer.setInStock(parsed.inStock());
                if (parsed.canonicalUrl() != null && !parsed.canonicalUrl().isBlank()) {
                    offer.setProductUrl(parsed.canonicalUrl());
                }
                if (parsed.externalId() != null) {
                    offer.setExternalId(parsed.externalId());
                }
                offer.setLastCheckedAt(Instant.now());
                updated++;
            } else {
                failed++;
            }
            sleepQuietly(requestDelayMs);
        }

        offerRepository.saveAll(offers);
        recalculateBestComponentPrices(offers);

        log.info("Оновлення цін завершено: оновлено={}, помилок={}", updated, failed);
        return new SyncReport(offers.size(), updated, failed, Instant.now());
    }

    private void recalculateBestComponentPrices(List<ComponentOffer> allOffers) {
        Map<PcComponent, List<ComponentOffer>> byComponent = allOffers.stream()
                .collect(Collectors.groupingBy(ComponentOffer::getComponent));

        List<PcComponent> toSave = new ArrayList<>();
        for (Map.Entry<PcComponent, List<ComponentOffer>> entry : byComponent.entrySet()) {
            PcComponent component = entry.getKey();
            List<ComponentOffer> componentOffers = entry.getValue();

            Optional<ComponentOffer> bestAvailable = componentOffers.stream()
                    .filter(ComponentOffer::isInStock)
                    .min(Comparator.comparing(ComponentOffer::getPriceUah));

            if (bestAvailable.isPresent()) {
                ComponentOffer best = bestAvailable.get();
                component.setInStock(true);
                component.setPriceUah(best.getPriceUah());
                component.setShopUrl(best.getProductUrl());
                component.setStoreName(best.getStoreName());
            } else {
                component.setInStock(false);
            }
            component.setPriceUpdatedAt(Instant.now());
            toSave.add(component);
        }
        componentRepository.saveAll(toSave);
    }

    private void sleepQuietly(long ms) {
        if (ms <= 0) return;
        try {
            Thread.sleep(ms);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }

    public record SyncReport(int totalOffers, int updated, int failed, Instant finishedAt) {}
}