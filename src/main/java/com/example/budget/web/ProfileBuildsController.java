package com.example.budget.web;

import com.example.budget.model.*;
import com.example.budget.repository.PcComponentRepository;
import com.example.budget.repository.SavedBuildRepository;
import com.example.budget.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.security.Principal;
import java.time.LocalDateTime;
import java.util.ArrayList;
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

    @GetMapping("/components")
    @Transactional(readOnly = true)
    public ResponseEntity<List<ComponentOptionDto>> getAvailableComponents(Principal principal) {
        if (principal == null) {
            return ResponseEntity.status(401).build();
        }
        List<ComponentOptionDto> list = componentRepository.findAll().stream()
                .map(c -> new ComponentOptionDto(
                        c.getId(),
                        c.getName(),
                        c.getType() != null ? c.getType().name() : "UNKNOWN",
                        c.getSocket(),
                        c.getPriceUah()
                ))
                .toList();
        return ResponseEntity.ok(list);
    }

    @PostMapping("/builds")
    @Transactional
    public ResponseEntity<?> saveBuild(@RequestBody SaveBuildRequest request, Principal principal) {
        if (principal == null) {
            return ResponseEntity.status(401).body("Не авторизовано");
        }

        String compatibilityError = validateSockets(request.componentIds());
        if (compatibilityError != null) {
            return ResponseEntity.badRequest().body(compatibilityError);
        }

        User user = userRepository.findByEmail(principal.getName()).orElseThrow();

        SavedBuild build = new SavedBuild();
        build.setUser(user);
        build.setTitle(request.title() != null && !request.title().isBlank() ? request.title().trim() : "Моя збірка ПК");
        build.setScenario(request.scenario() != null ? request.scenario() : "GAMING");

        applyComponentsToBuild(build, request.componentIds());
        savedBuildRepository.save(build);

        return ResponseEntity.ok("Збірку успішно збережено");
    }

    @PutMapping("/builds/{id}")
    @Transactional
    public ResponseEntity<?> updateBuild(
            @PathVariable Long id,
            @RequestBody SaveBuildRequest request,
            Principal principal
    ) {
        if (principal == null) {
            return ResponseEntity.status(401).body("Не авторизовано");
        }

        User user = userRepository.findByEmail(principal.getName()).orElseThrow();
        SavedBuild build = savedBuildRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Збірку не знайдено"));

        if (!build.getUser().getId().equals(user.getId())) {
            return ResponseEntity.status(403).body("Доступ заборонено");
        }

        String compatibilityError = validateSockets(request.componentIds());
        if (compatibilityError != null) {
            return ResponseEntity.badRequest().body(compatibilityError);
        }

        if (request.title() != null && !request.title().isBlank()) {
            build.setTitle(request.title().trim());
        }
        if (request.scenario() != null && !request.scenario().isBlank()) {
            build.setScenario(request.scenario());
        }

        if (request.componentIds() != null && !request.componentIds().isEmpty()) {
            build.getItems().clear();
            applyComponentsToBuild(build, request.componentIds());
        }

        savedBuildRepository.save(build);
        return ResponseEntity.ok("Збірку оновлено");
    }

    @GetMapping("/builds")
    @Transactional(readOnly = true)
    public ResponseEntity<List<BuildTrackerResponse>> getMyBuilds(Principal principal) {
        if (principal == null) {
            return ResponseEntity.status(401).build();
        }
        User user = userRepository.findByEmail(principal.getName()).orElseThrow();
        List<SavedBuild> builds = savedBuildRepository.findByUser(user);

        List<BuildTrackerResponse> response = builds.stream().map(b -> {
            BigDecimal currentTotal = BigDecimal.ZERO;
            List<ItemTrackerDto> itemDtos = new ArrayList<>();

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
    @Transactional
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

    private String validateSockets(List<Long> componentIds) {
        String cpuSocket = null;
        String mbSocket = null;

        if (componentIds != null) {
            for (Long componentId : componentIds) {
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

        if (cpuSocket != null && mbSocket != null && !cpuSocket.equalsIgnoreCase(mbSocket)) {
            return "Помилка сумісності: сокет процесора (" + cpuSocket + ") не збігається з сокетом материнської плати (" + mbSocket + ")";
        }
        return null;
    }

    private void applyComponentsToBuild(SavedBuild build, List<Long> componentIds) {
        BigDecimal totalSavedPrice = BigDecimal.ZERO;
        if (componentIds != null) {
            for (Long componentId : componentIds) {
                PcComponent component = componentRepository.findById(componentId).orElseThrow();

                SavedBuildItem item = new SavedBuildItem();
                item.setSavedBuild(build);
                item.setComponent(component);
                item.setCategory(component.getType() != null ? component.getType().name() : "UNKNOWN");
                item.setSavedPriceUah(component.getPriceUah());

                build.getItems().add(item);
                totalSavedPrice = totalSavedPrice.add(component.getPriceUah());
            }
        }
        build.setTotalSavedPriceUah(totalSavedPrice);
    }

    public record SaveBuildRequest(String title, String scenario, List<Long> componentIds) {}

    public record ComponentOptionDto(
            Long id,
            String name,
            String category,
            String socket,
            BigDecimal priceUah
    ) {}

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