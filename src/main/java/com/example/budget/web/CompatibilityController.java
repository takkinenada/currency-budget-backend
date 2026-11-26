package com.example.budget.web;

import com.example.budget.model.ComponentType;
import com.example.budget.model.MemoryType;
import com.example.budget.model.PcComponent;
import com.example.budget.repository.PcComponentRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/components")
public class CompatibilityController {

    private final PcComponentRepository componentRepository;

    public CompatibilityController(PcComponentRepository componentRepository) {
        this.componentRepository = componentRepository;
    }

    /**
     * Пошук сумісних комплектуючих за категорією та параметрами поточної збірки
     * (socket, memoryType, minWattage для БЖ, maxLengthMm для відеокарти).
     */
    @GetMapping("/compatible")
    public ResponseEntity<List<PcComponent>> getCompatibleComponents(
            @RequestParam ComponentType type,
            @RequestParam(required = false) String socket,
            @RequestParam(required = false) MemoryType memoryType,
            @RequestParam(required = false) Integer minWattage,
            @RequestParam(required = false) Integer maxLengthMm
    ) {
        List<PcComponent> candidates = componentRepository.findByTypeAndInStockTrue(type);

        List<PcComponent> filtered = candidates.stream().filter(c -> {
            // Перевірка сокета (для CPU та материнських плат)
            if (socket != null && !socket.isBlank() && c.getSocket() != null && !c.getSocket().equalsIgnoreCase(socket)) {
                return false;
            }
            // Перевірка типу пам'яті (DDR4 / DDR5)
            if (memoryType != null && c.getMemoryType() != null && c.getMemoryType() != memoryType) {
                return false;
            }
            // Перевірка мінімальної потужності для БЖ
            if (minWattage != null && c.getTdpWatts() != null && type == ComponentType.PSU && c.getTdpWatts() < minWattage) {
                return false;
            }
            // Перевірка максимальної довжини відеокарти у корпусі
            if (maxLengthMm != null && c.getLengthMm() != null && type == ComponentType.GPU && c.getLengthMm() > maxLengthMm) {
                return false;
            }
            return true;
        }).toList();

        return ResponseEntity.ok(filtered);
    }
}