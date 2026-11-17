package com.example.budget.build;

import com.example.budget.model.Brand;
import com.example.budget.model.PcComponent;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.List;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class BuildGeneratorTest {

    private final BuildGenerator generator = new BuildGenerator();
    private final List<PcComponent> catalog = TestCatalog.catalog();

    private List<GeneratedBuild> generate(int budget, Set<Brand> brands) {
        return generator.generate(catalog, BigDecimal.valueOf(budget), ComponentFilter.of(brands));
    }

    @Test
    void returnsThreeDistinctBuildsWithinBudget() {
        List<GeneratedBuild> result = generate(45_000, Set.of());

        assertEquals(3, result.size());
        assertEquals(3L, result.stream().map(GeneratedBuild::build).distinct().count());
        assertEquals(List.of(BuildProfile.VALUE, BuildProfile.PERFORMANCE, BuildProfile.TECHNOLOGY),
                result.stream().map(GeneratedBuild::profile).toList());

        for (GeneratedBuild g : result) {
            assertTrue(g.build().totalPrice().compareTo(BigDecimal.valueOf(45_000)) <= 0,
                    "збірка перевищує бюджет: " + g.build().totalPrice());
        }
    }

    @Test
    void everyBuildIsCompatible() {
        for (GeneratedBuild g : generate(60_000, Set.of())) {
            assertEquals(List.of(), CompatibilityChecker.problems(g.build()));
        }
    }

    @Test
    void performanceBuildIsNotWeakerThanOthers() {
        List<GeneratedBuild> result = generate(45_000, Set.of());
        double performance = result.stream()
                .filter(g -> g.profile() == BuildProfile.PERFORMANCE)
                .findFirst().orElseThrow().build().performanceScore();

        for (GeneratedBuild g : result) {
            assertTrue(performance >= g.build().performanceScore());
        }
    }

    @Test
    void gpuBrandFilterIsRespected() {
        List<GeneratedBuild> result = generate(60_000, Set.of(Brand.NVIDIA));

        assertFalse(result.isEmpty());
        for (GeneratedBuild g : result) {
            assertEquals("NVIDIA", g.build().gpu().getBrand());
        }
    }

    @Test
    void makerFilterAppliesToBoardPsuAndCase() {
        List<GeneratedBuild> result = generate(60_000, Set.of(Brand.MSI));

        assertFalse(result.isEmpty());
        for (GeneratedBuild g : result) {
            assertEquals("MSI", g.build().motherboard().getBrand());
            assertEquals("MSI", g.build().psu().getBrand());
            assertEquals("MSI", g.build().pcCase().getBrand());
        }
    }

    @Test
    void cpuBrandFilterIsRespected() {
        for (GeneratedBuild g : generate(60_000, Set.of(Brand.INTEL))) {
            assertEquals("Intel", g.build().cpu().getBrand());
        }
    }

    @Test
    void tooSmallBudgetGivesNoBuilds() {
        assertTrue(generate(5_000, Set.of()).isEmpty());
    }

    @Test
    void impossibleBrandCombinationGivesNoBuilds() {
        // У тестовому каталозі єдина плата для Intel-процесора (LGA1700) має бренд Gigabyte,
        // тому поєднання Intel + MSI неможливе навіть із великим бюджетом
        assertTrue(generate(100_000, Set.of(Brand.INTEL, Brand.MSI)).isEmpty());
    }

    @Test
    void longGpuIsNotPlacedInShortCase() {
        // Gigabyte: єдиний корпус Mini-Tower (290 мм), тому RX 7800 XT (300 мм) і RTX 5070 (305 мм) недоступні
        List<GeneratedBuild> result = generate(60_000, Set.of(Brand.GIGABYTE));
        assertFalse(result.isEmpty());
        for (GeneratedBuild g : result) {
            assertTrue(g.build().gpu().getLengthMm() <= 290, g.build().gpu().getName());
        }
    }
}
