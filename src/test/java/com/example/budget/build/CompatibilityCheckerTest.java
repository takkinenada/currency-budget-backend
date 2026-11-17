package com.example.budget.build;

import com.example.budget.model.MemoryType;
import com.example.budget.model.PcComponent;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class CompatibilityCheckerTest {

    private final PcComponent am5Cpu = TestCatalog.cpu("Ryzen 5 7600", "AMD", 6890, "AM5", MemoryType.DDR5, 65, 8, 8);
    private final PcComponent am5Board = TestCatalog.board("B650M", "MSI", 4200, "AM5", MemoryType.DDR5, "Micro-ATX", 8);
    private final PcComponent am4Board = TestCatalog.board("B550", "MSI", 3200, "AM4", MemoryType.DDR4, "ATX", 6);
    private final PcComponent ddr5 = TestCatalog.ram("16 ГБ DDR5", 1900, MemoryType.DDR5, 7);
    private final PcComponent ddr4 = TestCatalog.ram("16 ГБ DDR4", 1450, MemoryType.DDR4, 5);
    private final PcComponent gpu = TestCatalog.gpu("RX 7800 XT", "AMD", 20500, 263, 300, 9, 8);
    private final PcComponent ssd = TestCatalog.ssd("1 ТБ", 2480, 8, 8);
    private final PcComponent psu750 = TestCatalog.psu("750 Вт", "MSI", 3600, 750);
    private final PcComponent psu550 = TestCatalog.psu("550 Вт", "Gigabyte", 1850, 550);
    private final PcComponent atxCase = TestCatalog.pcCase("Mid-Tower", "MSI", 2100, "ATX", 340);
    private final PcComponent matxCase = TestCatalog.pcCase("Mini-Tower", "Gigabyte", 1210, "Micro-ATX", 310);
    private final PcComponent shortCase = TestCatalog.pcCase("Compact", "Gigabyte", 1000, "Micro-ATX", 250);

    @Test
    void compatibleBuildHasNoProblems() {
        PcBuild build = new PcBuild(am5Cpu, am5Board, ddr5, gpu, ssd, psu750, matxCase);
        assertEquals(java.util.List.of(), CompatibilityChecker.problems(build));
    }

    @Test
    void socketMismatchIsDetected() {
        assertFalse(CompatibilityChecker.cpuMatchesBoard(am5Cpu, am4Board));
        assertTrue(CompatibilityChecker.cpuMatchesBoard(am5Cpu, am5Board));
    }

    @Test
    void memoryTypeMismatchIsDetected() {
        assertFalse(CompatibilityChecker.ramMatchesBoard(ddr4, am5Board));
        assertTrue(CompatibilityChecker.ramMatchesBoard(ddr5, am5Board));
        assertFalse(CompatibilityChecker.cpuMemoryMatchesBoard(am5Cpu, am4Board));
    }

    @Test
    void weakPsuIsDetected() {
        // (65 + 263 + 100) * 1.3 = 556.4 -> 557 Вт
        assertEquals(557, CompatibilityChecker.requiredPsuWatts(am5Cpu, gpu));
        assertFalse(CompatibilityChecker.psuSufficient(psu550, am5Cpu, gpu));
        assertTrue(CompatibilityChecker.psuSufficient(psu750, am5Cpu, gpu));
    }

    @Test
    void atxBoardDoesNotFitMicroAtxCase() {
        assertFalse(CompatibilityChecker.caseFitsBoard(matxCase, am4Board));
        assertTrue(CompatibilityChecker.caseFitsBoard(atxCase, am4Board));
        assertTrue(CompatibilityChecker.caseFitsBoard(atxCase, am5Board));
    }

    @Test
    void longGpuDoesNotFitShortCase() {
        assertFalse(CompatibilityChecker.gpuFitsCase(gpu, shortCase));
        assertTrue(CompatibilityChecker.gpuFitsCase(gpu, atxCase));
        assertTrue(CompatibilityChecker.gpuFitsCase(gpu, matxCase));
    }

    @Test
    void problemsDescribeEveryViolation() {
        PcBuild bad = new PcBuild(am5Cpu, am4Board, ddr4, gpu, ssd, psu550, shortCase);
        // сокет, пам'ять CPU/плата, БЖ, довжина GPU. ОЗП DDR4 збігається з платою DDR4, форм-фактор ATX у mATX-корпусі не підходить
        assertEquals(5, CompatibilityChecker.problems(bad).size());
    }
}
