package com.example.budget.service;

import com.example.budget.dto.BudgetRequest;
import com.example.budget.dto.ConvertedBudgetResponse;
import com.example.budget.model.Budget;
import com.example.budget.model.Currency;
import com.example.budget.repository.BudgetRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;

@Service
public class BudgetService {

    private final BudgetRepository repository;
    private final CurrencyConversionService conversion;
    private final ExchangeRateService rates;

    public BudgetService(BudgetRepository repository,
                         CurrencyConversionService conversion,
                         ExchangeRateService rates) {
        this.repository = repository;
        this.conversion = conversion;
        this.rates = rates;
    }

    @Transactional
    public Budget create(BudgetRequest request) {
        return repository.save(new Budget(request.name(), request.amount(), request.currency()));
    }

    @Transactional(readOnly = true)
    public List<Budget> findAll() {
        return repository.findAll();
    }

    @Transactional(readOnly = true)
    public Budget get(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Бюджет " + id + " не знайдено"));
    }

    @Transactional
    public Budget update(Long id, BudgetRequest request) {
        Budget budget = get(id);
        budget.setName(request.name());
        budget.setAmount(request.amount());
        budget.setCurrency(request.currency());
        return budget;
    }

    @Transactional
    public void delete(Long id) {
        repository.delete(get(id));
    }

    /** Перерахунок бюджету в UAH/USD/EUR за актуальними курсами. */
    @Transactional(readOnly = true)
    public ConvertedBudgetResponse convertedView(Long id) {
        Budget budget = get(id);
        Map<Currency, BigDecimal> converted = new EnumMap<>(Currency.class);
        for (Currency target : Currency.values()) {
            converted.put(target, conversion.convert(budget.getAmount(), budget.getCurrency(), target));
        }
        LocalDate ratesDate = rates.latestRates().stream()
                .map(r -> r.getRateDate())
                .max(LocalDate::compareTo)
                .orElse(null);
        return new ConvertedBudgetResponse(
                budget.getId(), budget.getName(), budget.getAmount(), budget.getCurrency(), converted, ratesDate);
    }
}
