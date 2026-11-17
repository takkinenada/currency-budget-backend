package com.example.budget.model;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "component_offers")
public class ComponentOffer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "component_id", nullable = false)
    private PcComponent component;

    @Enumerated(EnumType.STRING)
    @Column(name = "store_name", nullable = false, length = 32)
    private StoreType storeName;

    @Column(name = "external_id", length = 128)
    private String externalId;

    @Column(name = "product_url", nullable = false, length = 1024)
    private String productUrl;

    @Column(name = "price_uah", nullable = false, precision = 19, scale = 2)
    private BigDecimal priceUah;

    @Column(name = "in_stock", nullable = false)
    private boolean inStock = true;

    @Column(name = "last_checked_at")
    private Instant lastCheckedAt;

    public ComponentOffer() {
    }

    public ComponentOffer(PcComponent component, StoreType storeName, String productUrl, BigDecimal priceUah, boolean inStock) {
        this.component = component;
        this.storeName = storeName;
        this.productUrl = productUrl;
        this.priceUah = priceUah;
        this.inStock = inStock;
        this.lastCheckedAt = Instant.now();
    }

    public Long getId() { return id; }
    public PcComponent getComponent() { return component; }
    public void setComponent(PcComponent component) { this.component = component; }
    public StoreType getStoreName() { return storeName; }
    public void setStoreName(StoreType storeName) { this.storeName = storeName; }
    public String getExternalId() { return externalId; }
    public void setExternalId(String externalId) { this.externalId = externalId; }
    public String getProductUrl() { return productUrl; }
    public void setProductUrl(String productUrl) { this.productUrl = productUrl; }
    public BigDecimal getPriceUah() { return priceUah; }
    public void setPriceUah(BigDecimal priceUah) { this.priceUah = priceUah; }
    public boolean isInStock() { return inStock; }
    public void setInStock(boolean inStock) { this.inStock = inStock; }
    public Instant getLastCheckedAt() { return lastCheckedAt; }
    public void setLastCheckedAt(Instant lastCheckedAt) { this.lastCheckedAt = lastCheckedAt; }
}