package com.example.budget.service.monetization;

import com.example.budget.model.*;
import com.example.budget.repository.AffiliateClickRepository;
import com.example.budget.repository.ComponentOfferRepository;
import com.example.budget.repository.PcComponentRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AffiliateServiceTest {

    @Mock PcComponentRepository componentRepository;
    @Mock ComponentOfferRepository offerRepository;
    @Mock AffiliateClickRepository clickRepository;

    private AffiliateService service;

    @BeforeEach
    void setUp() {
        service = new AffiliateService(componentRepository, offerRepository, clickRepository);
        ReflectionTestUtils.setField(service, "affiliateTag", "pcpicker");
        ReflectionTestUtils.setField(service, "utmMedium", "affiliate");
    }

    @Test
    void addsAffiliateTagsToStoreUrl() {
        String url = service.buildAffiliateUrl("https://rozetka.com.ua/p123/?ref=old", StoreType.ROZETKA);

        assertThat(url).contains("utm_source=pcpicker");
        assertThat(url).contains("utm_medium=affiliate");
        assertThat(url).contains("partner=pcpicker");
        assertThat(url).contains("utm_campaign=rozetka");
    }

    @Test
    void registersClickAndReturnsUpdatedCounter() {
        PcComponent cpu = new PcComponent(
                ComponentType.CPU, "AMD Ryzen 5 7500F", "AMD", new BigDecimal("5200"),
                "AM5", MemoryType.DDR5, 65, null, null, 80, 75, 85
        );
        cpu.setShopUrl("https://rozetka.com.ua/p123/");
        cpu.setStoreName(StoreType.ROZETKA);

        when(componentRepository.findById(1L)).thenReturn(Optional.of(cpu));
        when(offerRepository.findByComponentIdOrderByInStockDescPriceUahAsc(1L)).thenReturn(List.of());
        when(clickRepository.countByComponentId(1L)).thenReturn(1L);

        Optional<AffiliateService.ClickResult> result = service.registerClick(1L, null);

        assertThat(result).isPresent();
        assertThat(result.get().totalClicks()).isEqualTo(1L);
        assertThat(result.get().affiliateUrl()).contains("partner=pcpicker");
        verify(clickRepository).save(any(AffiliateClick.class));
    }
}