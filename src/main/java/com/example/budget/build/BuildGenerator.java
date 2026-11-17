package com.example.budget.build;

import com.example.budget.model.ComponentType;
import com.example.budget.model.PcComponent;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Comparator;
import java.util.EnumMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.function.Predicate;

/**
 * Ядро сервісу: з каталогу комплектуючих підбирає до трьох оптимальних збірок у межах бюджету.
 *
 * <p>Алгоритм:
 * <ol>
 *   <li>Фільтрація каталогу за брендами ({@link ComponentFilter}).</li>
 *   <li>Перебір комбінацій CPU, плата, ОЗП, GPU з відсіканням несумісних пар
 *       ({@link CompatibilityChecker}) і тих, що вже не вкладаються в бюджет.</li>
 *   <li>Для кожної комбінації добирається найдешевший сумісний блок живлення й корпус,
 *       а SSD бере або найдешевший, або найкращий із тих, що лишились у бюджеті.</li>
 *   <li>З усіх валідних збірок обираються три різні за профілями: Потужність, Технології, Ціна/якість.</li>
 * </ol>
 */
public class BuildGenerator {

    /** Збірка «Ціна/якість» має давати щонайменше цю частку від максимально можливої продуктивності. */
    private static final double VALUE_PERFORMANCE_FLOOR = 0.8;

    public List<GeneratedBuild> generate(Collection<PcComponent> catalog, BigDecimal budgetUah, ComponentFilter filter) {
        Map<ComponentType, List<PcComponent>> byType = new EnumMap<>(ComponentType.class);
        for (ComponentType type : ComponentType.values()) {
            byType.put(type, new ArrayList<>());
        }
        catalog.stream()
                .filter(filter::accepts)
                .sorted(Comparator.comparing(PcComponent::getPriceUah))
                .forEach(c -> byType.get(c.getType()).add(c));

        if (byType.values().stream().anyMatch(List::isEmpty)) {
            return List.of();
        }

        List<PcBuild> candidates = enumerate(byType, budgetUah);
        if (candidates.isEmpty()) {
            return List.of();
        }
        return select(candidates);
    }

    private List<PcBuild> enumerate(Map<ComponentType, List<PcComponent>> byType, BigDecimal budget) {
        List<PcComponent> cpus = byType.get(ComponentType.CPU);
        List<PcComponent> boards = byType.get(ComponentType.MOTHERBOARD);
        List<PcComponent> rams = byType.get(ComponentType.RAM);
        List<PcComponent> gpus = byType.get(ComponentType.GPU);
        List<PcComponent> ssds = byType.get(ComponentType.SSD);
        List<PcComponent> psus = byType.get(ComponentType.PSU);
        List<PcComponent> cases = byType.get(ComponentType.CASE);

        // Списки відсортовані за ціною, тому перший елемент найдешевший.
        BigDecimal minSsd = ssds.get(0).getPriceUah();
        BigDecimal minPsu = psus.get(0).getPriceUah();
        BigDecimal minCase = cases.get(0).getPriceUah();

        List<PcBuild> result = new ArrayList<>();
        for (PcComponent cpu : cpus) {
            for (PcComponent board : boards) {
                if (!CompatibilityChecker.cpuMatchesBoard(cpu, board)
                        || !CompatibilityChecker.cpuMemoryMatchesBoard(cpu, board)) {
                    continue;
                }
                for (PcComponent ram : rams) {
                    if (!CompatibilityChecker.ramMatchesBoard(ram, board)) {
                        continue;
                    }
                    BigDecimal platform = cpu.getPriceUah().add(board.getPriceUah()).add(ram.getPriceUah());
                    for (PcComponent gpu : gpus) {
                        BigDecimal lowerBound = platform.add(gpu.getPriceUah()).add(minSsd).add(minPsu).add(minCase);
                        if (lowerBound.compareTo(budget) > 0) {
                            break; // GPU відсортовані за ціною, подальші ще дорожчі
                        }
                        PcComponent psu = firstMatching(psus, p -> CompatibilityChecker.psuSufficient(p, cpu, gpu));
                        if (psu == null) {
                            continue;
                        }
                        PcComponent pcCase = firstMatching(cases, c ->
                                CompatibilityChecker.caseFitsBoard(c, board) && CompatibilityChecker.gpuFitsCase(gpu, c));
                        if (pcCase == null) {
                            continue;
                        }
                        BigDecimal withoutSsd = platform.add(gpu.getPriceUah())
                                .add(psu.getPriceUah()).add(pcCase.getPriceUah());
                        addSsdVariants(result, cpu, board, ram, gpu, psu, pcCase, ssds, withoutSsd, budget);
                    }
                }
            }
        }
        return result;
    }

    /** Додає варіант із найдешевшим SSD і варіант із найкращим SSD, який ще вміщується в бюджет. */
    private void addSsdVariants(List<PcBuild> result, PcComponent cpu, PcComponent board, PcComponent ram,
                                PcComponent gpu, PcComponent psu, PcComponent pcCase,
                                List<PcComponent> ssds, BigDecimal withoutSsd, BigDecimal budget) {
        BigDecimal remaining = budget.subtract(withoutSsd);
        PcComponent cheapest = ssds.get(0);
        if (cheapest.getPriceUah().compareTo(remaining) > 0) {
            return;
        }
        result.add(new PcBuild(cpu, board, ram, gpu, cheapest, psu, pcCase));

        ssds.stream()
                .filter(s -> s.getPriceUah().compareTo(remaining) <= 0)
                .max(Comparator.comparingInt((PcComponent s) -> s.getGamingScore() + s.getTechScore())
                        .thenComparing(PcComponent::getPriceUah, Comparator.reverseOrder()))
                .filter(best -> best != cheapest)
                .ifPresent(best -> result.add(new PcBuild(cpu, board, ram, gpu, best, psu, pcCase)));
    }

    private List<GeneratedBuild> select(List<PcBuild> candidates) {
        double bestPerformance = candidates.stream().mapToDouble(PcBuild::performanceScore).max().orElse(0);
        Set<PcBuild> used = new HashSet<>();

        Comparator<PcBuild> byPrice = Comparator.comparing(PcBuild::totalPrice);
        // Оцінки в БД грубі (1..10) і швидко впираються в максимум, тому при рівних балах
        // перевагу мають дорожчі, тобто потужніші, збірки.
        Comparator<PcBuild> performance = Comparator.comparingDouble(PcBuild::performanceScore)
                .thenComparingDouble(PcBuild::techScore)
                .thenComparing(byPrice);
        Comparator<PcBuild> technology = Comparator
                .comparingDouble((PcBuild b) -> 0.6 * b.techScore() + 0.4 * b.performanceScore())
                .thenComparingDouble(PcBuild::performanceScore)
                .thenComparing(byPrice);
        Comparator<PcBuild> value = Comparator
                .comparingDouble((PcBuild b) -> b.performanceScore() / b.totalPrice().doubleValue())
                .thenComparingDouble(PcBuild::performanceScore);

        Optional<PcBuild> performancePick = pick(candidates, used, b -> true, performance);
        performancePick.ifPresent(used::add);

        Optional<PcBuild> technologyPick = pick(candidates, used, b -> true, technology);
        technologyPick.ifPresent(used::add);

        Predicate<PcBuild> goodEnough = b -> b.performanceScore() >= VALUE_PERFORMANCE_FLOOR * bestPerformance;
        Optional<PcBuild> valuePick = pick(candidates, used, goodEnough, value);
        if (valuePick.isEmpty()) {
            valuePick = pick(candidates, used, b -> true, value);
        }

        // Порядок виводу, як у макеті: Збірка 1 (Ціна/якість), Збірка 2 (Потужність), Збірка 3 (Технології)
        List<GeneratedBuild> result = new ArrayList<>();
        valuePick.ifPresent(b -> result.add(new GeneratedBuild(BuildProfile.VALUE, b)));
        performancePick.ifPresent(b -> result.add(new GeneratedBuild(BuildProfile.PERFORMANCE, b)));
        technologyPick.ifPresent(b -> result.add(new GeneratedBuild(BuildProfile.TECHNOLOGY, b)));
        return result;
    }

    private static Optional<PcBuild> pick(List<PcBuild> candidates, Set<PcBuild> used,
                                          Predicate<PcBuild> filter, Comparator<PcBuild> order) {
        return candidates.stream()
                .filter(b -> !used.contains(b))
                .filter(filter)
                .max(order);
    }

    private static PcComponent firstMatching(List<PcComponent> sortedByPrice, Predicate<PcComponent> predicate) {
        for (PcComponent c : sortedByPrice) {
            if (predicate.test(c)) {
                return c;
            }
        }
        return null;
    }

}
