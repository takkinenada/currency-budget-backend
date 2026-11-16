package com.example.budget.web;

import com.example.budget.dto.ConversionResponse;
import com.example.budget.dto.RateResponse;
import com.example.budget.model.Currency;
import com.example.budget.service.CurrencyConversionService;
import com.example.budget.service.ExchangeRateService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api")
public class RateController {

    private final ExchangeRateService rates;
    private final CurrencyConversionService conversion;

    public RateController(ExchangeRateService rates, CurrencyConversionService conversion) {
        this.rates = rates;
        this.conversion = conversion;
    }

    /** Останні збережені курси USD і EUR до гривні. */
    @GetMapping("/rates")
    public List<RateResponse> latest() {
        return rates.latestRates().stream().map(RateResponse::from).toList();
    }

    /** Примусове оновлення курсів з НБУ (корисно для демонстрації). */
    @PostMapping("/rates/refresh")
    public List<RateResponse> refresh() {
        return rates.refreshRates().stream().map(RateResponse::from).toList();
    }

    /** Приклад: GET /api/convert?from=USD&to=UAH&amount=100 */
    @GetMapping("/convert")
    public ConversionResponse convert(@RequestParam Currency from,
                                      @RequestParam Currency to,
                                      @RequestParam BigDecimal amount) {
        return new ConversionResponse(from, to, amount, conversion.convert(amount, from, to));
    }
}
