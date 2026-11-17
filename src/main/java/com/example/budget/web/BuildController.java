package com.example.budget.web;

import com.example.budget.dto.BuildRequest;
import com.example.budget.dto.BuildResultResponse;
import com.example.budget.service.BuildService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/builds")
public class BuildController {

    private final BuildService service;

    public BuildController(BuildService service) {
        this.service = service;
    }

    /**
     * Підбір трьох збірок під бюджет. Приклад тіла запиту:
     * {"budget": 40000, "currency": "UAH", "brands": ["NVIDIA", "AMD", "MSI"]}
     */
    @PostMapping("/generate")
    public BuildResultResponse generate(@Valid @RequestBody BuildRequest request) {
        return service.generate(request);
    }
}
