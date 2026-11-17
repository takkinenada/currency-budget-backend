package com.example.budget.build;

/** Профілі трьох збірок (збігаються з макетом: Ціна/якість, Потужність, Технології). */
public enum BuildProfile {
    VALUE("Ціна/якість", "Майже максимум продуктивності за найменші гроші"),
    PERFORMANCE("Потужність", "Максимум грошей на відеокарту й процесор"),
    TECHNOLOGY("Технології", "Сучасні стандарти: DDR5, PCIe 5.0, DLSS/FSR, трасування променів");

    private final String title;
    private final String description;

    BuildProfile(String title, String description) {
        this.title = title;
        this.description = description;
    }

    public String title() {
        return title;
    }

    public String description() {
        return description;
    }
}
