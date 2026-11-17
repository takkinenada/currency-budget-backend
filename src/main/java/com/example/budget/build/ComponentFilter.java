package com.example.budget.build;

import com.example.budget.model.Brand;
import com.example.budget.model.PcComponent;

import java.util.EnumSet;
import java.util.Set;

/**
 * Фільтрація комплектуючих за обраними брендами (колонка {@code brand} в БД).
 * <ul>
 *   <li>Процесор: якщо обрано AMD і/або Intel, береться лише вибраний виробник.</li>
 *   <li>Відеокарта: якщо обрано NVIDIA і/або AMD, береться лише вибраний виробник чипа.</li>
 *   <li>Материнська плата, блок живлення, корпус: якщо обрано MSI і/або Gigabyte, береться лише вибраний виробник.</li>
 *   <li>Якщо для категорії нічого не обрано, обмеження немає. ОЗП і SSD не фільтруються.</li>
 * </ul>
 */
public final class ComponentFilter {

    private final Set<Brand> cpuBrands = EnumSet.noneOf(Brand.class);
    private final Set<Brand> gpuBrands = EnumSet.noneOf(Brand.class);
    private final Set<Brand> makers = EnumSet.noneOf(Brand.class);

    private ComponentFilter(Set<Brand> selected) {
        if (selected != null) {
            for (Brand brand : selected) {
                if (brand == null) {
                    continue;
                }
                if (brand.isCpuVendor()) {
                    cpuBrands.add(brand);
                }
                if (brand.isGpuVendor()) {
                    gpuBrands.add(brand);
                }
                if (brand.isMaker()) {
                    makers.add(brand);
                }
            }
        }
    }

    public static ComponentFilter of(Set<Brand> selectedBrands) {
        return new ComponentFilter(selectedBrands);
    }

    public boolean accepts(PcComponent c) {
        return switch (c.getType()) {
            case CPU -> brandAccepted(cpuBrands, c);
            case GPU -> brandAccepted(gpuBrands, c);
            case MOTHERBOARD, PSU, CASE -> brandAccepted(makers, c);
            default -> true;
        };
    }

    private static boolean brandAccepted(Set<Brand> allowed, PcComponent c) {
        return allowed.isEmpty() || allowed.stream().anyMatch(b -> b.matches(c.getBrand()));
    }
}
