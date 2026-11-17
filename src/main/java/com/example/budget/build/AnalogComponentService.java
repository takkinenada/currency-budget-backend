package com.example.budget.build;

import com.example.budget.model.ComponentType;
import com.example.budget.model.PcComponent;
import com.example.budget.repository.PcComponentRepository;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.Comparator;
import java.util.List;
import java.util.Objects;
import java.util.Optional;

@Service
public class AnalogComponentService {

    private final PcComponentRepository componentRepository;

    public AnalogComponentService(PcComponentRepository componentRepository) {
        this.componentRepository = componentRepository;
    }

    public Optional<SubstitutionResult> resolveAvailableOrAnalog(PcComponent target, ComponentFilter filter) {
        if (target.isInStock()) {
            return Optional.of(new SubstitutionResult(target, false, null));
        }

        List<PcComponent> sameTypeInStock = componentRepository.findByTypeAndInStockTrue(target.getType()).stream()
                .filter(c -> !Objects.equals(c.getId(), target.getId()))
                .filter(c -> isCompatibleReplacement(target, c))
                .toList();

        // 1. Спочатку шукаємо аналог серед обраних користувачем брендів
        if (filter != null) {
            Optional<PcComponent> preferredBrandAnalog = pickClosest(
                    sameTypeInStock.stream().filter(filter::accepts).toList(),
                    target
            );
            if (preferredBrandAnalog.isPresent()) {
                return Optional.of(new SubstitutionResult(preferredBrandAnalog.get(), true, target.getName()));
            }
        }

        // 2. Fallback: якщо в обраних брендів немає нічого в наявності, беремо найближчий сумісний аналог будь-якого бренду
        return pickClosest(sameTypeInStock, target)
                .map(analog -> new SubstitutionResult(analog, true, target.getName()));
    }

    private Optional<PcComponent> pickClosest(List<PcComponent> candidates, PcComponent target) {
        int targetTotalScore = totalScore(target);
        return candidates.stream()
                .min(Comparator
                        .comparing((PcComponent c) -> priceDiff(c.getPriceUah(), target.getPriceUah()))
                        .thenComparingInt(c -> Math.abs(totalScore(c) - targetTotalScore)));
    }

    private boolean isCompatibleReplacement(PcComponent original, PcComponent candidate) {
        ComponentType type = original.getType();

        // Сокет має збігатися (CPU, MOTHERBOARD)
        if (original.getSocket() != null && !Objects.equals(original.getSocket(), candidate.getSocket())) {
            return false;
        }
        // Тип пам'яті має збігатися (CPU, MOTHERBOARD, RAM)
        if (original.getMemoryType() != null && original.getMemoryType() != candidate.getMemoryType()) {
            return false;
        }
        // Форм-фактор (MOTHERBOARD, CASE)
        if (original.getFormFactor() != null && !Objects.equals(original.getFormFactor(), candidate.getFormFactor())) {
            return false;
        }
        // Для БЖ аналог не може бути слабшим за потужністю (tdpWatts)
        if (type == ComponentType.PSU && original.getTdpWatts() != null && candidate.getTdpWatts() != null
                && candidate.getTdpWatts() < original.getTdpWatts()) {
            return false;
        }
        // Для відеокарти аналог не має бути довшим за оригінал, щоб точно вліз у корпус
        if (type == ComponentType.GPU && original.getLengthMm() != null && candidate.getLengthMm() != null
                && candidate.getLengthMm() > original.getLengthMm()) {
            return false;
        }
        // Для корпусу аналог не має мати менший ліміт довжини відеокарти
        if (type == ComponentType.CASE && original.getLengthMm() != null && candidate.getLengthMm() != null
                && candidate.getLengthMm() < original.getLengthMm()) {
            return false;
        }
        return true;
    }

    private int totalScore(PcComponent c) {
        return c.getGamingScore() + c.getWorkScore() + c.getTechScore();
    }

    private BigDecimal priceDiff(BigDecimal a, BigDecimal b) {
        if (a == null || b == null) return BigDecimal.valueOf(Double.MAX_VALUE);
        return a.subtract(b).abs();
    }

    public record SubstitutionResult(
            PcComponent component,
            boolean substituted,
            String replacedComponentName
    ) {}
}