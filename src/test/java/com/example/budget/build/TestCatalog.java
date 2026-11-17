package com.example.budget.build;

import com.example.budget.model.ComponentType;
import com.example.budget.model.MemoryType;
import com.example.budget.model.PcComponent;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

/** Невеликий каталог для тестів (незалежний від БД). Оцінки 1..10, як у таблиці components. */
final class TestCatalog {

    private TestCatalog() {
    }

    static PcComponent cpu(String name, String brand, int price, String socket, MemoryType mem,
                           int tdp, int gaming, int tech) {
        return new PcComponent(ComponentType.CPU, name, brand, BigDecimal.valueOf(price),
                socket, mem, tdp, null, null, gaming, gaming, tech);
    }

    static PcComponent gpu(String name, String brand, int price, int tdp, int lengthMm, int gaming, int tech) {
        return new PcComponent(ComponentType.GPU, name, brand, BigDecimal.valueOf(price),
                null, null, tdp, null, lengthMm, gaming, gaming, tech);
    }

    static PcComponent board(String name, String brand, int price, String socket, MemoryType mem,
                             String formFactor, int tech) {
        return new PcComponent(ComponentType.MOTHERBOARD, name, brand, BigDecimal.valueOf(price),
                socket, mem, 30, formFactor, null, 5, 5, tech);
    }

    static PcComponent ram(String name, int price, MemoryType mem, int tech) {
        return new PcComponent(ComponentType.RAM, name, "Kingston", BigDecimal.valueOf(price),
                null, mem, 8, null, null, 5, 5, tech);
    }

    static PcComponent ssd(String name, int price, int gaming, int tech) {
        return new PcComponent(ComponentType.SSD, name, "Kingston", BigDecimal.valueOf(price),
                null, null, 5, null, null, gaming, gaming, tech);
    }

    static PcComponent psu(String name, String brand, int price, int watts) {
        return new PcComponent(ComponentType.PSU, name, brand, BigDecimal.valueOf(price),
                null, null, watts, null, null, 5, 5, 5);
    }

    static PcComponent pcCase(String name, String brand, int price, String maxBoard, int maxGpuMm) {
        return new PcComponent(ComponentType.CASE, name, brand, BigDecimal.valueOf(price),
                null, null, 0, maxBoard, maxGpuMm, 5, 5, 5);
    }

    static List<PcComponent> catalog() {
        List<PcComponent> c = new ArrayList<>();
        c.add(cpu("Ryzen 5 5600", "AMD", 4100, "AM4", MemoryType.DDR4, 65, 7, 5));
        c.add(cpu("Ryzen 5 7600", "AMD", 6890, "AM5", MemoryType.DDR5, 65, 8, 8));
        c.add(cpu("Core i5-12400F", "Intel", 4600, "LGA1700", MemoryType.DDR4, 65, 7, 6));
        c.add(cpu("Ryzen 7 7800X3D", "AMD", 16500, "AM5", MemoryType.DDR5, 120, 10, 9));

        c.add(gpu("GeForce RTX 4060", "NVIDIA", 12500, 115, 240, 7, 8));
        c.add(gpu("Radeon RX 7700 XT", "AMD", 15400, 245, 280, 8, 7));
        c.add(gpu("Radeon RX 7800 XT", "AMD", 20500, 263, 300, 9, 8));
        c.add(gpu("GeForce RTX 5070", "NVIDIA", 22900, 250, 305, 10, 10));

        c.add(board("MSI B550M", "MSI", 3200, "AM4", MemoryType.DDR4, "Micro-ATX", 6));
        c.add(board("MSI B650M", "MSI", 4200, "AM5", MemoryType.DDR5, "Micro-ATX", 8));
        c.add(board("Gigabyte X870 ATX Wi-Fi", "Gigabyte", 8900, "AM5", MemoryType.DDR5, "ATX", 10));
        c.add(board("Gigabyte H610M DDR4", "Gigabyte", 2800, "LGA1700", MemoryType.DDR4, "Micro-ATX", 5));

        c.add(ram("16 ГБ DDR4-3200", 1450, MemoryType.DDR4, 5));
        c.add(ram("16 ГБ DDR5-5600", 1900, MemoryType.DDR5, 7));
        c.add(ram("32 ГБ DDR5-6400", 4200, MemoryType.DDR5, 9));

        c.add(ssd("512 ГБ NVMe Gen3", 1300, 6, 5));
        c.add(ssd("1 ТБ NVMe Gen4", 2480, 8, 8));
        c.add(ssd("2 ТБ NVMe Gen5", 7900, 9, 10));

        c.add(psu("550 Вт Bronze", "Gigabyte", 1850, 550));
        c.add(psu("750 Вт Gold", "MSI", 3600, 750));
        c.add(psu("1000 Вт Platinum", "MSI", 6800, 1000));

        c.add(pcCase("Mini-Tower", "Gigabyte", 1210, "Micro-ATX", 290));
        c.add(pcCase("Mid-Tower", "MSI", 2100, "ATX", 340));
        return c;
    }
}
