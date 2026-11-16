package com.example.budget.web;

import com.example.budget.dto.BudgetRequest;
import com.example.budget.dto.BudgetResponse;
import com.example.budget.dto.ConvertedBudgetResponse;
import com.example.budget.service.BudgetService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/budgets")
public class BudgetController {

    private final BudgetService service;

    public BudgetController(BudgetService service) {
        this.service = service;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public BudgetResponse create(@Valid @RequestBody BudgetRequest request) {
        return BudgetResponse.from(service.create(request));
    }

    @GetMapping
    public List<BudgetResponse> list() {
        return service.findAll().stream().map(BudgetResponse::from).toList();
    }

    @GetMapping("/{id}")
    public BudgetResponse get(@PathVariable Long id) {
        return BudgetResponse.from(service.get(id));
    }

    @PutMapping("/{id}")
    public BudgetResponse update(@PathVariable Long id, @Valid @RequestBody BudgetRequest request) {
        return BudgetResponse.from(service.update(id, request));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        service.delete(id);
    }

    /** Бюджет, перерахований в UAH / USD / EUR за курсом НБУ. */
    @GetMapping("/{id}/converted")
    public ConvertedBudgetResponse converted(@PathVariable Long id) {
        return service.convertedView(id);
    }
}
