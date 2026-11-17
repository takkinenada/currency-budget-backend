package com.example.budget.model;

/**
 * Бренди, які користувач може обрати на сайті (NVIDIA, AMD, Intel, MSI, Gigabyte).
 */
public enum Brand {
    NVIDIA,
    AMD,
    INTEL,
    MSI,
    GIGABYTE;

    /** Виробник графічного чипа, який можна обрати для відеокарти. */
    public boolean isGpuVendor() {
        return this == NVIDIA || this == AMD;
    }

    /** Виробник процесора. */
    public boolean isCpuVendor() {
        return this == AMD || this == INTEL;
    }

    /** Виробник материнських плат, блоків живлення й корпусів. */
    public boolean isMaker() {
        return this == MSI || this == GIGABYTE;
    }

    /** Порівняння з рядком із колонки {@code brand} (регістр не важливий: "Intel" = INTEL). */
    public boolean matches(String brandColumn) {
        return name().equalsIgnoreCase(brandColumn);
    }
}
