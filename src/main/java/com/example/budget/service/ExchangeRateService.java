package com.example.budget.service;

import com.example.budget.model.Currency;
import com.example.budget.model.ExchangeRate;
import com.example.budget.repository.ExchangeRateRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Optional;

@Service
public class ExchangeRateService {

    private static final Logger log = LoggerFactory.getLogger(ExchangeRateService.class);
    private static final DateTimeFormatter NBU_DATE = DateTimeFormatter.ofPattern("dd.MM.yyyy");

    private final NbuRateClient client;
    private final ExchangeRateRepository repository;

    public ExchangeRateService(NbuRateClient client, ExchangeRateRepository repository) {
        this.client = client;
        this.repository = repository;
    }

    /** Завантажуємо курси при старті, щоб конвертація працювала одразу. */
    @EventListener(ApplicationReadyEvent.class)
    public void refreshOnStartup() {
        safeRefresh();
    }

    /** Автоматичне оновлення за розкладом (cron з application.yml). */
    @Scheduled(cron = "${nbu.refresh-cron}", zone = "${nbu.zone}")
    public void refreshScheduled() {
        safeRefresh();
    }

    private void safeRefresh() {
        try {
            refreshRates();
        } catch (Exception e) {
            // не валимо застосунок, якщо НБУ тимчасово недоступний — використовуємо останні збережені курси
            log.warn("Не вдалося оновити курси НБУ: {}", e.getMessage());
        }
    }

    @Transactional
    public List<ExchangeRate> refreshRates() {
        List<NbuRateClient.NbuRate> fetched = client.fetchRates();
        List<ExchangeRate> saved = new java.util.ArrayList<>();

        for (NbuRateClient.NbuRate r : fetched) {
            Currency currency = toCurrency(r.cc());
            if (currency == null || currency == Currency.UAH) {
                continue;
            }
            LocalDate date = LocalDate.parse(r.exchangeDate(), NBU_DATE);
            ExchangeRate entity = repository.findByCurrencyAndRateDate(currency, date)
                    .orElseGet(() -> new ExchangeRate(currency, r.rate(), date));
            entity.setRateToUah(r.rate());
            entity.setFetchedAt(Instant.now());
            saved.add(repository.save(entity));
        }
        log.info("Курси НБУ оновлено: {}", saved.size());
        return saved;
    }

    /** Скільки гривень коштує 1 одиниця валюти (для UAH — 1). */
    @Transactional(readOnly = true)
    public BigDecimal rateToUah(Currency currency) {
        if (currency == Currency.UAH) {
            return BigDecimal.ONE;
        }
        return latest(currency)
                .map(ExchangeRate::getRateToUah)
                .orElseThrow(() -> new RateNotAvailableException(currency));
    }

    @Transactional(readOnly = true)
    public Optional<ExchangeRate> latest(Currency currency) {
        return repository.findFirstByCurrencyOrderByRateDateDescFetchedAtDesc(currency);
    }

    @Transactional(readOnly = true)
    public List<ExchangeRate> latestRates() {
        return List.of(Currency.USD, Currency.EUR).stream()
                .map(this::latest)
                .flatMap(Optional::stream)
                .toList();
    }

    private static Currency toCurrency(String code) {
        if (code == null) {
            return null;
        }
        try {
            return Currency.valueOf(code);
        } catch (IllegalArgumentException e) {
            return null;
        }
    }

    public static class RateNotAvailableException extends RuntimeException {
        public RateNotAvailableException(Currency currency) {
            super("Курс для валюти " + currency + " ще не завантажено");
        }
    }
}
