package com.example.budget.build;

public enum BuildScenario {
    GAMING, // Пріоритет на відеокарту (GPU) та ігрову продуктивність
    WORK,   // Пріоритет на процесор (CPU) та оперативну пам'ять (рендер/розробка)
    OFFICE  // Баланс на мінімальну вартість та надійність
}