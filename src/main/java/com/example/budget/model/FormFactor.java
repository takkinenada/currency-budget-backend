package com.example.budget.model;

/**
 * Типорозмір материнської плати. Для корпусу це максимальний типорозмір плати, який він підтримує.
 */
public enum FormFactor {
    ITX(1),
    MATX(2),
    ATX(3);

    private final int rank;

    FormFactor(int rank) {
        this.rank = rank;
    }

    /** Чи поміститься плата цього типорозміру в корпус, що підтримує {@code caseMax}. */
    public boolean fitsIn(FormFactor caseMax) {
        return this.rank <= caseMax.rank;
    }

    /** Розбір значення колонки form_factor ("ATX", "Micro-ATX", "Mini-ITX"); невідоме значення дає null. */
    public static FormFactor fromLabel(String label) {
        if (label == null) {
            return null;
        }
        return switch (label.trim().toUpperCase()) {
            case "ATX" -> ATX;
            case "MICRO-ATX", "MATX", "M-ATX" -> MATX;
            case "MINI-ITX", "ITX" -> ITX;
            default -> null;
        };
    }
}
