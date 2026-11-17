package com.example.budget.build;

import com.example.budget.model.PcComponent;

import java.math.BigDecimal;
import java.util.List;

/** Повна збірка ПК із семи комплектуючих. */
public record PcBuild(PcComponent cpu,
                      PcComponent motherboard,
                      PcComponent ram,
                      PcComponent gpu,
                      PcComponent ssd,
                      PcComponent psu,
                      PcComponent pcCase) {

    public List<PcComponent> parts() {
        return List.of(cpu, motherboard, ram, gpu, ssd, psu, pcCase);
    }

    public BigDecimal totalPrice() {
        return parts().stream()
                .map(PcComponent::getPriceUah)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    /** Ігрова продуктивність 0..100: головна вага у відеокарти (оцінки в БД 1..10). */
    public double performanceScore() {
        return 10.0 * (0.35 * cpu.getGamingScore() + 0.65 * gpu.getGamingScore());
    }

    /** Сучасність технологій 0..100: GPU, платформа (плата), пам'ять і SSD. */
    public double techScore() {
        return 10.0 * (0.4 * gpu.getTechScore()
                + 0.2 * motherboard.getTechScore()
                + 0.2 * ram.getTechScore()
                + 0.2 * ssd.getTechScore());
    }
}
