package com.example.budget.build;

import com.example.budget.model.FormFactor;
import com.example.budget.model.PcComponent;

import java.util.ArrayList;
import java.util.List;

/**
 * Правила сумісності комплектуючих:
 * <ol>
 *   <li>Сокет процесора збігається із сокетом материнської плати.</li>
 *   <li>Тип пам'яті процесора, плати й ОЗП (DDR4/DDR5) однаковий.</li>
 *   <li>Блок живлення покриває споживання CPU + GPU з запасом.</li>
 *   <li>Типорозмір материнської плати підтримується корпусом.</li>
 *   <li>Відеокарта за довжиною вміщується в корпус.</li>
 * </ol>
 */
public final class CompatibilityChecker {

    /** Споживання решти системи (плата, диски, вентилятори), Вт. */
    private static final int BASE_SYSTEM_WATTS = 100;
    /** Запас потужності БЖ. */
    private static final double PSU_HEADROOM = 1.3;

    private CompatibilityChecker() {
    }

    public static boolean cpuMatchesBoard(PcComponent cpu, PcComponent board) {
        return cpu.getSocket() != null && cpu.getSocket().equalsIgnoreCase(board.getSocket());
    }

    /** Процесор працює з тим самим типом пам'яті, що й плата. */
    public static boolean cpuMemoryMatchesBoard(PcComponent cpu, PcComponent board) {
        return cpu.getMemoryType() == null || cpu.getMemoryType() == board.getMemoryType();
    }

    public static boolean ramMatchesBoard(PcComponent ram, PcComponent board) {
        return ram.getMemoryType() != null && ram.getMemoryType() == board.getMemoryType();
    }

    /** Мінімальна потужність БЖ для пари CPU + GPU, Вт. */
    public static int requiredPsuWatts(PcComponent cpu, PcComponent gpu) {
        int load = cpu.getTdpWatts() + gpu.getTdpWatts() + BASE_SYSTEM_WATTS;
        return (int) Math.ceil(load * PSU_HEADROOM);
    }

    public static boolean psuSufficient(PcComponent psu, PcComponent cpu, PcComponent gpu) {
        return psu.getTdpWatts() >= requiredPsuWatts(cpu, gpu);
    }

    public static boolean caseFitsBoard(PcComponent pcCase, PcComponent board) {
        FormFactor boardSize = board.getFormFactorEnum();
        FormFactor caseMax = pcCase.getFormFactorEnum();
        return boardSize != null && caseMax != null && boardSize.fitsIn(caseMax);
    }

    /** Довжина відеокарти не перевищує допустиму для корпусу (якщо довжини невідомі, вважаємо, що вміщується). */
    public static boolean gpuFitsCase(PcComponent gpu, PcComponent pcCase) {
        return gpu.getLengthMm() == null || pcCase.getLengthMm() == null
                || gpu.getLengthMm() <= pcCase.getLengthMm();
    }

    /** Список порушених правил; порожній, якщо збірка сумісна. */
    public static List<String> problems(PcBuild b) {
        List<String> problems = new ArrayList<>();
        if (!cpuMatchesBoard(b.cpu(), b.motherboard())) {
            problems.add("Сокет процесора " + b.cpu().getSocket()
                    + " не збігається з сокетом плати " + b.motherboard().getSocket());
        }
        if (!cpuMemoryMatchesBoard(b.cpu(), b.motherboard())) {
            problems.add("Процесор працює з " + b.cpu().getMemoryType()
                    + ", а плата підтримує " + b.motherboard().getMemoryType());
        }
        if (!ramMatchesBoard(b.ram(), b.motherboard())) {
            problems.add("Пам'ять " + b.ram().getMemoryType()
                    + " не підтримується платою (потрібна " + b.motherboard().getMemoryType() + ")");
        }
        if (!psuSufficient(b.psu(), b.cpu(), b.gpu())) {
            problems.add("Блок живлення " + b.psu().getTdpWatts() + " Вт замалий, потрібно щонайменше "
                    + requiredPsuWatts(b.cpu(), b.gpu()) + " Вт");
        }
        if (!caseFitsBoard(b.pcCase(), b.motherboard())) {
            problems.add("Плата " + b.motherboard().getFormFactor()
                    + " не вміщається в корпус (максимум " + b.pcCase().getFormFactor() + ")");
        }
        if (!gpuFitsCase(b.gpu(), b.pcCase())) {
            problems.add("Відеокарта " + b.gpu().getLengthMm() + " мм не вміщається в корпус (максимум "
                    + b.pcCase().getLengthMm() + " мм)");
        }
        return problems;
    }

    public static boolean isCompatible(PcBuild b) {
        return problems(b).isEmpty();
    }
}
