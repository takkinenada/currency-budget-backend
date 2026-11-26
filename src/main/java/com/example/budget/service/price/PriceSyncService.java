package com.example.budget.service.price;

import com.example.budget.model.ComponentOffer;
import com.example.budget.model.ComponentType;
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

import java.math.BigDecimal;
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

    @Value("${prices.request-delay-ms:200}")
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
        return syncPrices(0); // 0 = оновити всі за розкладом
    }

    @Transactional
    public SyncReport syncPrices(int limit) {
        List<ComponentOffer> allOffers = offerRepository.findAllWithComponent();

        // Спочатку беремо ті, що ще ніколи не оновлювалися, потім найстаріші
        List<ComponentOffer> targetOffers = allOffers.stream()
                .sorted(Comparator.comparing(
                        ComponentOffer::getLastCheckedAt,
                        Comparator.nullsFirst(Comparator.naturalOrder())
                ))
                .toList();

        if (limit > 0 && targetOffers.size() > limit) {
            targetOffers = targetOffers.subList(0, limit);
        }

        int updated = 0;
        int failed = 0;

        for (ComponentOffer offer : targetOffers) {
            StorePriceClient client = clientsByStore.get(offer.getStoreName());
            if (client == null) {
                continue;
            }

            String searchQuery = buildSmartQuery(offer.getComponent());

            Optional<StorePriceClient.ParsedOffer> parsedOpt = client.fetchOffer(
                    offer.getProductUrl(),
                    offer.getExternalId(),
                    searchQuery,
                    offer.getPriceUah()
            );
            if (parsedOpt.isEmpty()) {
                parsedOpt = client.fetchOffer(offer.getProductUrl(), offer.getExternalId());
            }

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
                log.info("Оновлено [{}]: {} -> {} грн (в наявності: {})",
                        offer.getStoreName(), offer.getComponent().getName(), parsed.priceUah(), parsed.inStock());
            } else {
                failed++;
                offer.setLastCheckedAt(Instant.now()); // щоб наступного разу не застрягати на ньому
            }

            sleepQuietly(requestDelayMs);
        }

        offerRepository.saveAll(targetOffers);
        recalculateBestComponentPrices(allOffers);

        log.info("Синхронізація цін завершена: оброблено={}, оновлено={}, помилок={}", targetOffers.size(), updated, failed);
        return new SyncReport(targetOffers.size(), updated, failed, Instant.now());
    }

    private String buildSmartQuery(PcComponent c) {
        String name = c.getName();
        String brand = c.getBrand() != null ? c.getBrand() : "";
        if (!brand.isBlank() && !name.toLowerCase().contains(brand.toLowerCase())) {
            name = brand + " " + name;
        }

        String prefix = switch (c.getType()) {
            case CPU -> "Процесор ";
            case GPU -> "Відеокарта ";
            case MOTHERBOARD -> "Материнська плата ";
            case RAM -> "Оперативна пам'ять ";
            case SSD -> "Накопичувач SSD ";
            case PSU -> "Блок живлення ";
            case CASE -> "Корпус ";
            default -> "";
        };

        return prefix + name;
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