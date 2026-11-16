package com.example.budget.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

/**
 * Курс валюти до гривні: скільки UAH коштує 1 одиниця валюти.
 */
@Entity
@Table(name = "exchange_rates")
public class ExchangeRate {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 3)
    private Currency currency;

    @Column(name = "rate_to_uah", nullable = false, precision = 19, scale = 6)
    private BigDecimal rateToUah;

    @Column(name = "rate_date", nullable = false)
    private LocalDate rateDate;

    @Column(name = "fetched_at", nullable = false)
    private Instant fetchedAt = Instant.now();

    protected ExchangeRate() {
    }

    public ExchangeRate(Currency currency, BigDecimal rateToUah, LocalDate rateDate) {
        this.currency = currency;
        this.rateToUah = rateToUah;
        this.rateDate = rateDate;
    }

    public Long getId() {
        return id;
    }

    public Currency getCurrency() {
        return currency;
    }

    public BigDecimal getRateToUah() {
        return rateToUah;
    }

    public void setRateToUah(BigDecimal rateToUah) {
        this.rateToUah = rateToUah;
    }

    public LocalDate getRateDate() {
        return rateDate;
    }

    public Instant getFetchedAt() {
        return fetchedAt;
    }

    public void setFetchedAt(Instant fetchedAt) {
        this.fetchedAt = fetchedAt;
    }
}
