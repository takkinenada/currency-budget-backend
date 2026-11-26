package com.example.budget.web;

import com.example.budget.model.*;
import com.example.budget.repository.PcComponentRepository;
import com.example.budget.repository.SavedBuildRepository;
import com.example.budget.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.security.Principal;
import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/profile")
public class ProfileBuildsController {

    private final SavedBuildRepository savedBuildRepository;
    private final UserRepository userRepository;
    private final PcComponentRepository componentRepository;

    public ProfileBuildsController(
            SavedBuildRepository savedBuildRepository,
            UserRepository userRepository,
            PcComponentRepository componentRepository
    ) {
        this.savedBuildRepository = savedBuildRepository;
        this.userRepository = userRepository;
        this.componentRepository = componentRepository;
    }

    @PostMapping("/builds")
    public ResponseEntity<?> saveBuild(@RequestBody SaveBuildRequest request, Principal principal) {
        if (principal == null) {
            return ResponseEntity.status(401).body("Не авторизовано");
        }

        // 1. Спочатку перевіряємо сумісність сокетів процесора та мат. плати
        String cpuSocket = null;
        String mbSocket = null;

        if (request.componentIds() != null) {
            for (Long componentId : request.componentIds()) {
                PcComponent component = componentRepository.findById(componentId)
                        .orElseThrow(() -> new IllegalArgumentException("Компонент не знайдено: " + componentId));

                if (component.getType() == ComponentType.CPU) {
                    cpuSocket = component.getSocket();
                }
                if (component.getType() == ComponentType.MOTHERBOARD) {
                    mbSocket = component.getSocket();
                }
            }
        }

        // Валідація сокетів
        if (cpuSocket != null && mbSocket != null && !cpuSocket.equalsIgnoreCase(mbSocket)) {
            return ResponseEntity.badRequest().body("Помилка сумісності: сокет процесора (" + cpuSocket + ") не збігається з сокетом материнської плати (" + mbSocket + ")");
        }

        // 2. Якщо все ок — зберігаємо збірку
        User user = userRepository.findByEmail(principal.getName()).orElseThrow();

        SavedBuild build = new SavedBuild();
        build.setUser(user);
        build.setTitle(request.title() != null ? request.title() : "Моя збірка ПК");
        build.setScenario(request.scenario() != null ? request.scenario() : "GAMING");

        BigDecimal totalSavedPrice = BigDecimal.ZERO;

        for (Long componentId : request.componentIds()) {
            PcComponent component = componentRepository.findById(componentId).orElseThrow();

            SavedBuildItem item = new SavedBuildItem();
            item.setSavedBuild(build);
            item.setComponent(component);
            item.setCategory(component.getType() != null ? component.getType().name() : "UNKNOWN");
            item.setSavedPriceUah(component.getPriceUah());

            build.getItems().add(item);
            totalSavedPrice = totalSavedPrice.add(component.getPriceUah());
        }

        build.setTotalSavedPriceUah(totalSavedPrice);
        savedBuildRepository.save(build);

        return ResponseEntity.ok("Збірку успішно збережено");
    }

    @GetMapping("/builds")
    public ResponseEntity<List<BuildTrackerResponse>> getMyBuilds(Principal principal) {
        if (principal == null) {
            return ResponseEntity.status(401).build();
        }
        User user = userRepository.findByEmail(principal.getName()).orElseThrow();
        List<SavedBuild> builds = savedBuildRepository.findByUser(user);

        List<BuildTrackerResponse> response = builds.stream().map(b -> {
            BigDecimal currentTotal = BigDecimal.ZERO;
            List<ItemTrackerDto> itemDtos = new java.util.ArrayList<>();

            for (SavedBuildItem item : b.getItems()) {
                PcComponent currentComp = item.getComponent();
                BigDecimal currentPrice = currentComp != null ? currentComp.getPriceUah() : item.getSavedPriceUah();
                BigDecimal itemDiff = currentPrice.subtract(item.getSavedPriceUah());

                currentTotal = currentTotal.add(currentPrice);

                itemDtos.add(new ItemTrackerDto(
                        currentComp != null ? currentComp.getId() : null,
                        currentComp != null ? currentComp.getName() : "Невідомо",
                        item.getCategory(),
                        item.getSavedPriceUah(),
                        currentPrice,
                        itemDiff
                ));
            }

            BigDecimal totalDiff = currentTotal.subtract(b.getTotalSavedPriceUah());

            return new BuildTrackerResponse(
                    b.getId(),
                    b.getTitle(),
                    b.getScenario(),
                    b.getTotalSavedPriceUah(),
                    currentTotal,
                    totalDiff,
                    b.getCreatedAt(),
                    itemDtos
            );
        }).toList();

        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/builds/{id}")
    public ResponseEntity<?> deleteBuild(@PathVariable Long id, Principal principal) {
        if (principal == null) {
            return ResponseEntity.status(401).build();
        }
        User user = userRepository.findByEmail(principal.getName()).orElseThrow();
        SavedBuild build = savedBuildRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Збірку не знайдено"));

        if (!build.getUser().getId().equals(user.getId())) {
            return ResponseEntity.status(403).body("Доступ заборонено");
        }

        savedBuildRepository.delete(build);
        return ResponseEntity.ok("Збірку видалено");
    }

    public record SaveBuildRequest(String title, String scenario, List<Long> componentIds) {}

    public record ItemTrackerDto(
            Long componentId,
            String componentName,
            String category,
            BigDecimal savedPriceUah,
            BigDecimal currentPriceUah,
            BigDecimal priceDiffUah
    ) {}

    public record BuildTrackerResponse(
            Long buildId,
            String title,
            String scenario,
            BigDecimal savedTotalPriceUah,
            BigDecimal currentTotalPriceUah,
            BigDecimal priceDiffUah,
            LocalDateTime createdAt,
            List<ItemTrackerDto> items
    ) {}
}