package com.example.budget.service.monetization;

import com.example.budget.model.AffiliateClick;
import com.example.budget.model.ComponentOffer;
import com.example.budget.model.PcComponent;
import com.example.budget.model.StoreType;
import com.example.budget.repository.AffiliateClickRepository;
import com.example.budget.repository.ComponentOfferRepository;
import com.example.budget.repository.PcComponentRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.util.UriComponentsBuilder;

import java.util.List;
import java.util.Optional;

@Service
public class AffiliateService {

    private final PcComponentRepository componentRepository;
    private final ComponentOfferRepository offerRepository;
    private final AffiliateClickRepository clickRepository;

    @Value("${monetization.affiliate-tag:pcpicker}")
    private String affiliateTag;

    @Value("${monetization.utm-medium:affiliate}")
    private String utmMedium;

    public AffiliateService(
            PcComponentRepository componentRepository,
            ComponentOfferRepository offerRepository,
            AffiliateClickRepository clickRepository
    ) {
        this.componentRepository = componentRepository;
        this.offerRepository = offerRepository;
        this.clickRepository = clickRepository;
    }

    /**
     * Додає партнерські мітки (utm_source, utm_medium, partner) до посилання на магазин.
     */
    public String buildAffiliateUrl(String rawUrl, StoreType store) {
        if (rawUrl == null || rawUrl.isBlank()) {
            return rawUrl;
        }
        UriComponentsBuilder builder = UriComponentsBuilder.fromHttpUrl(rawUrl)
                .replaceQueryParam("utm_source", affiliateTag)
                .replaceQueryParam("utm_medium", utmMedium)
                .replaceQueryParam("partner", affiliateTag);

        if (store != null) {
            builder.replaceQueryParam("utm_campaign", store.name().toLowerCase());
        }
        return builder.build(true).toUriString();
    }

    /**
     * Фіксує клік і повертає фінальне партнерське посилання для переходу в магазин.
     */
    @Transactional
    public Optional<ClickResult> registerClick(Long componentId, StoreType requestedStore) {
        Optional<PcComponent> componentOpt = componentRepository.findById(componentId);
        if (componentOpt.isEmpty()) {
            return Optional.empty();
        }
        PcComponent component = componentOpt.get();

        List<ComponentOffer> offers = offerRepository.findByComponentIdOrderByInStockDescPriceUahAsc(componentId);
        Optional<ComponentOffer> matchedOffer = offers.stream()
                .filter(o -> requestedStore == null || o.getStoreName() == requestedStore)
                .findFirst();

        StoreType store = matchedOffer.map(ComponentOffer::getStoreName).orElse(component.getStoreName());
        String baseUrl = matchedOffer.map(ComponentOffer::getProductUrl).orElse(component.getShopUrl());
        if (baseUrl == null || baseUrl.isBlank()) {
            return Optional.empty();
        }

        String affiliateUrl = buildAffiliateUrl(baseUrl, store);
        clickRepository.save(new AffiliateClick(component, store, affiliateUrl));
        long totalClicks = clickRepository.countByComponentId(componentId);

        return Optional.of(new ClickResult(componentId, store, affiliateUrl, totalClicks));
    }

    public long getClicksCount(Long componentId) {
        return clickRepository.countByComponentId(componentId);
    }

    public List<AffiliateClickRepository.ClickStatRow> getStats() {
        return clickRepository.findClickStats();
    }

    public record ClickResult(
            Long componentId,
            StoreType storeName,
            String affiliateUrl,
            long totalClicks
    ) {}
}