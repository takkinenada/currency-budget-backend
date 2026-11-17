package com.example.budget.service;

import com.example.budget.model.Currency;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.assertEquals;

class CurrencyConversionServiceTest {

    private CurrencyConversionService service;

    @BeforeEach
    void setUp() {
        ExchangeRateService rates = Mockito.mock(ExchangeRateService.class);
        Mockito.when(rates.rateToUah(Currency.UAH)).thenReturn(BigDecimal.ONE);
        Mockito.when(rates.rateToUah(Currency.USD)).thenReturn(new BigDecimal("40.00"));
        Mockito.when(rates.rateToUah(Currency.EUR)).thenReturn(new BigDecimal("50.00"));
        service = new CurrencyConversionService(rates);
    }

    @Test
    void usdToUah() {
        assertEquals(new BigDecimal("4000.00"), service.convert(new BigDecimal("100"), Currency.USD, Currency.UAH));
    }

    @Test
    void uahToEur() {
        assertEquals(new BigDecimal("20.00"), service.convert(new BigDecimal("1000"), Currency.UAH, Currency.EUR));
    }

    @Test
    void usdToEurGoesThroughUah() {
        assertEquals(new BigDecimal("80.00"), service.convert(new BigDecimal("100"), Currency.USD, Currency.EUR));
    }

    @Test
    void sameCurrencyIsUnchanged() {
        assertEquals(new BigDecimal("123.46"), service.convert(new BigDecimal("123.456"), Currency.EUR, Currency.EUR));
    }
}
