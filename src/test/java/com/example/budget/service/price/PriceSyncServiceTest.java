package com.example.budget.service.price;

import com.example.budget.model.*;
import com.example.budget.repository.ComponentOfferRepository;
import com.example.budget.repository.PcComponentRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PriceSyncServiceTest {

    @Mock ComponentOfferRepository offerRepository;
    @Mock PcComponentRepository componentRepository;
    @Mock StorePriceClient rozetkaClient;
    @Mock StorePriceClient comfyClient;

    @Test
    void switchesStoreToComfyWhenRozetkaOutOfStock() {
        when(rozetkaClient.supportedStore()).thenReturn(StoreType.ROZETKA);
        when(comfyClient.supportedStore()).thenReturn(StoreType.COMFY);

        PcComponent gpu = new PcComponent(
                ComponentType.GPU, "RTX 4060", "NVIDIA", new BigDecimal("14000"),
                null, null, 115, null, 240, 75, 65, 80
        );

        ComponentOffer rozetka = new ComponentOffer(
                gpu, StoreType.ROZETKA, "https://rozetka.com.ua/p123/", new BigDecimal("14000"), true
        );
        ComponentOffer comfy = new ComponentOffer(
                gpu, StoreType.COMFY, "https://comfy.ua/rtx4060.html", new BigDecimal("14500"), true
        );

        when(offerRepository.findAllWithComponent()).thenReturn(List.of(rozetka, comfy));
        when(rozetkaClient.fetchOffer("https://rozetka.com.ua/p123/", null))
                .thenReturn(Optional.of(new StorePriceClient.ParsedOffer(
                        new BigDecimal("14000"), false, "https://rozetka.com.ua/p123/", "123")));
        when(comfyClient.fetchOffer("https://comfy.ua/rtx4060.html", null))
                .thenReturn(Optional.of(new StorePriceClient.ParsedOffer(
                        new BigDecimal("14500"), true, "https://comfy.ua/rtx4060.html", "456")));

        PriceSyncService service = new PriceSyncService(
                offerRepository, componentRepository, List.of(rozetkaClient, comfyClient)
        );
        service.syncAllPrices();

        assertThat(gpu.isInStock()).isTrue();
        assertThat(gpu.getPriceUah()).isEqualByComparingTo("14500");
        assertThat(gpu.getShopUrl()).isEqualTo("https://comfy.ua/rtx4060.html");
        assertThat(gpu.getStoreName()).isEqualTo(StoreType.COMFY);
    }

    @Test
    void marksOutOfStockWhenUnavailableEverywhere() {
        when(rozetkaClient.supportedStore()).thenReturn(StoreType.ROZETKA);

        PcComponent cpu = new PcComponent(
                ComponentType.CPU, "Ryzen 5 7500F", "AMD", new BigDecimal("7000"),
                "AM5", MemoryType.DDR5, 65, null, null, 80, 75, 85
        );
        ComponentOffer rozetka = new ComponentOffer(
                cpu, StoreType.ROZETKA, "https://rozetka.com.ua/p999/", new BigDecimal("7000"), true
        );

        when(offerRepository.findAllWithComponent()).thenReturn(List.of(rozetka));
        when(rozetkaClient.fetchOffer("https://rozetka.com.ua/p999/", null))
                .thenReturn(Optional.of(new StorePriceClient.ParsedOffer(
                        new BigDecimal("7000"), false, "https://rozetka.com.ua/p999/", "999")));

        PriceSyncService service = new PriceSyncService(
                offerRepository, componentRepository, List.of(rozetkaClient)
        );
        service.syncAllPrices();

        assertThat(cpu.isInStock()).isFalse();
    }
}