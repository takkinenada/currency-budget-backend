package com.example.budget.web;

import com.example.budget.build.AnalogComponentService;
import com.example.budget.model.ComponentOffer;
import com.example.budget.model.PcComponent;
import com.example.budget.repository.ComponentOfferRepository;
import com.example.budget.repository.PcComponentRepository;
import com.example.budget.service.price.PriceSyncService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

@RestController
@RequestMapping("/api")
public class PriceController {

    private final PriceSyncService priceSyncService;
    private final ComponentOfferRepository offerRepository;
    private final PcComponentRepository componentRepository;
    private final AnalogComponentService analogComponentService;

    public PriceController(
            PriceSyncService priceSyncService,
            ComponentOfferRepository offerRepository,
            PcComponentRepository componentRepository,
            AnalogComponentService analogComponentService
    ) {
        this.priceSyncService = priceSyncService;
        this.offerRepository = offerRepository;
        this.componentRepository = componentRepository;
        this.analogComponentService = analogComponentService;
    }

    /**
     * Ручний запуск оновлення цін.
     * За замовчуванням оновлює 10 найстаріших/неперевірених пропозицій (~15-20 сек).
     * Для оновлення всіх: POST /api/prices/refresh?limit=0
     */
    @PostMapping("/prices/refresh")
    public PriceSyncService.SyncReport refreshPrices(
            @RequestParam(required = false, defaultValue = "10") int limit
    ) {
        return priceSyncService.syncPrices(limit);
    }

    /**
     * Отримати всі пропозиції магазинів (Rozetka, Comfy тощо) з прямими посиланнями для деталі.
     */
    @GetMapping("/components/{id}/offers")
    public ResponseEntity<List<OfferResponse>> getOffers(@PathVariable Long id) {
        if (!componentRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        List<OfferResponse> offers = offerRepository
                .findByComponentIdOrderByInStockDescPriceUahAsc(id)
                .stream()
                .map(OfferResponse::from)
                .toList();
        return ResponseEntity.ok(offers);
    }

    /**
     * Повертає саму деталь (якщо є в наявності) або підбирає сумісний аналог.
     */
    @GetMapping("/components/{id}/analog")
    public ResponseEntity<AnalogResponse> findAnalog(@PathVariable Long id) {
        return componentRepository.findById(id)
                .flatMap(component -> analogComponentService.resolveAvailableOrAnalog(component, null))
                .map(AnalogResponse::from)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    public record OfferResponse(
            String storeName,
            String productUrl,
            BigDecimal priceUah,
            boolean inStock,
            Instant lastCheckedAt
    ) {
        public static OfferResponse from(ComponentOffer o) {
            return new OfferResponse(
                    o.getStoreName() != null ? o.getStoreName().name() : null,
                    o.getProductUrl(),
                    o.getPriceUah(),
                    o.isInStock(),
                    o.getLastCheckedAt()
            );
        }
    }

    public record AnalogResponse(
            Long id,
            String name,
            String brand,
            BigDecimal priceUah,
            String storeName,
            String shopUrl,
            boolean inStock,
            boolean substituted,
            String replacedComponentName
    ) {
        public static AnalogResponse from(AnalogComponentService.SubstitutionResult result) {
            PcComponent c = result.component();
            return new AnalogResponse(
                    c.getId(),
                    c.getName(),
                    c.getBrand(),
                    c.getPriceUah(),
                    c.getStoreName() != null ? c.getStoreName().name() : null,
                    c.getShopUrl(),
                    c.isInStock(),
                    result.substituted(),
                    result.replacedComponentName()
            );
        }
    }
}