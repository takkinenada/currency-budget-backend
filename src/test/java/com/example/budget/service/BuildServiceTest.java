package com.example.budget.service;

import com.example.budget.dto.BuildRequest;
import com.example.budget.dto.BuildResponse;
import com.example.budget.dto.BuildResultResponse;
import com.example.budget.model.*;
import com.example.budget.repository.ComponentOfferRepository;
import com.example.budget.repository.PcComponentRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigDecimal;
import java.util.List;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class BuildServiceTest {

    @Mock PcComponentRepository componentRepository;
    @Mock ComponentOfferRepository offerRepository;
    @Mock CurrencyConversionService conversionService;

    @Test
    void picksCheapestInStockOfferAndFillsAffiliateFields() {
        PcComponent cpu = component(1L, ComponentType.CPU, "Ryzen 5 7500F", "AMD", "6000", "AM5", MemoryType.DDR5, 65, null, null);
        PcComponent mb = component(2L, ComponentType.MOTHERBOARD, "MSI B650M", "MSI", "5500", "AM5", MemoryType.DDR5, null, "Micro-ATX", null);
        PcComponent ram = component(3L, ComponentType.RAM, "Kingston 16GB", "Kingston", "2500", null, MemoryType.DDR5, null, null, null);
        PcComponent gpu = component(4L, ComponentType.GPU, "RTX 4060", "NVIDIA", "15000", null, null, 115, null, 240);
        PcComponent ssd = component(5L, ComponentType.SSD, "SSD 1TB", "Kingston", "2500", null, null, null, null, null);
        PcComponent psu = component(6L, ComponentType.PSU, "MSI 650W", "MSI", "2500", null, null, 650, null, null);
        PcComponent pcCase = component(7L, ComponentType.CASE, "Gigabyte Case", "Gigabyte", "2000", null, null, null, "ATX", 320);

        // Для відеокарти Rozetka дорожча/немає, Comfy дешевша і в наявності
        ComponentOffer gpuRozetka = new ComponentOffer(gpu, StoreType.ROZETKA, "https://rozetka.com.ua/p1/", new BigDecimal("15000"), false);
        ComponentOffer gpuComfy = new ComponentOffer(gpu, StoreType.COMFY, "https://comfy.ua/gpu.html", new BigDecimal("13500"), true);
        ComponentOffer cpuRozetka = new ComponentOffer(cpu, StoreType.ROZETKA, "https://rozetka.com.ua/p2/", new BigDecimal("5800"), true);

        when(componentRepository.findAll()).thenReturn(List.of(cpu, mb, ram, gpu, ssd, psu, pcCase));
        when(offerRepository.findAll()).thenReturn(List.of(gpuRozetka, gpuComfy, cpuRozetka));
        when(conversionService.convert(any(BigDecimal.class), any(Currency.class), eq(Currency.UAH)))
                .thenAnswer(inv -> inv.getArgument(0));

        BuildService service = new BuildService(componentRepository, conversionService, offerRepository);
        BuildResultResponse result = service.generate(new BuildRequest(new BigDecimal("40000"), Currency.UAH, Set.of()));

        assertThat(result.builds()).isNotEmpty();
        BuildResponse.Part gpuPart = result.builds().get(0).parts().stream()
                .filter(p -> p.type() == ComponentType.GPU)
                .findFirst()
                .orElseThrow();

        assertThat(gpuPart.componentId()).isEqualTo(4L);
        assertThat(gpuPart.storeName()).isEqualTo(StoreType.COMFY);
        assertThat(gpuPart.inStock()).isTrue();
        assertThat(gpuPart.shopUrl()).isEqualTo("https://comfy.ua/gpu.html");
        assertThat(gpuPart.affiliateUrl()).isEqualTo("/api/affiliate/go/4");
        assertThat(gpuPart.priceUah()).isEqualByComparingTo("13500");
    }

    private static PcComponent component(Long id, ComponentType type, String name, String brand, String price,
                                         String socket, MemoryType memoryType, Integer tdp, String formFactor, Integer lengthMm) {
        PcComponent c = new PcComponent(type, name, brand, new BigDecimal(price),
                socket, memoryType, tdp, formFactor, lengthMm, 70, 70, 70);
        ReflectionTestUtils.setField(c, "id", id);
        c.setStoreName(StoreType.ROZETKA);
        c.setShopUrl("https://rozetka.com.ua/default/" + id);
        return c;
    }
}