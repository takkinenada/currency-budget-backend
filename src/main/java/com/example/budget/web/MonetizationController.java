package com.example.budget.web;

import com.example.budget.model.ComponentType;
import com.example.budget.model.PcComponent;
import com.example.budget.model.StoreType;
import com.example.budget.repository.AffiliateClickRepository;
import com.example.budget.repository.PcComponentRepository;
import com.example.budget.service.monetization.AffiliateService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.net.URI;
import java.util.List;

@RestController
@RequestMapping("/api")
public class MonetizationController {

    private final PcComponentRepository componentRepository;
    private final AffiliateService affiliateService;

    public MonetizationController(PcComponentRepository componentRepository, AffiliateService affiliateService) {
        this.componentRepository = componentRepository;
        this.affiliateService = affiliateService;
    }

    /**
     * Пріоритетний показ товарів: спочатку спонсорські з позначкою «Реклама», з партнерськими посиланнями.
     */
    @GetMapping("/promo/components")
    public List<PromoComponentResponse> getPrioritizedComponents(
            @RequestParam(required = false) ComponentType type
    ) {
        List<PcComponent> list = (type != null)
                ? componentRepository.findByTypeOrderBySponsoredDescSponsorPriorityDescIdAsc(type)
                : componentRepository.findAllByOrderBySponsoredDescSponsorPriorityDescIdAsc();

        return list.stream()
                .map(c -> new PromoComponentResponse(
                        c.getId(),
                        c.getType().name(),
                        c.getName(),
                        c.getBrand(),
                        c.getPriceUah(),
                        c.isSponsored(),
                        c.isSponsored() ? (c.getPromoLabel() != null ? c.getPromoLabel() : "Реклама") : null,
                        affiliateService.buildAffiliateUrl(c.getShopUrl(), c.getStoreName()),
                        affiliateService.getClicksCount(c.getId())
                ))
                .toList();
    }

    /**
     * Перехід у магазин: рахує клік і перенаправляє (302) на партнерське посилання.
     */
    @GetMapping("/affiliate/go/{componentId}")
    public ResponseEntity<Void> redirectToStore(
            @PathVariable Long componentId,
            @RequestParam(required = false) StoreType store
    ) {
        return affiliateService.registerClick(componentId, store)
                .map(res -> {
                    HttpHeaders headers = new HttpHeaders();
                    headers.setLocation(URI.create(res.affiliateUrl()));
                    return new ResponseEntity<Void>(headers, HttpStatus.FOUND);
                })
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    /**
     * Альтернатива для фронтенду (POST): фіксує клік і повертає JSON з лічильником та партнерським URL.
     */
    @PostMapping("/affiliate/components/{componentId}/click")
    public ResponseEntity<AffiliateService.ClickResult> trackClick(
            @PathVariable Long componentId,
            @RequestParam(required = false) StoreType store
    ) {
        return affiliateService.registerClick(componentId, store)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    /**
     * Загальна статистика кліків за партнерськими посиланнями.
     */
    @GetMapping("/affiliate/stats")
    public List<AffiliateClickRepository.ClickStatRow> getStats() {
        return affiliateService.getStats();
    }

    public record PromoComponentResponse(
            Long id,
            String category,
            String name,
            String brand,
            BigDecimal priceUah,
            boolean sponsored,
            String promoLabel,
            String affiliateUrl,
            long clicks
    ) {}
}