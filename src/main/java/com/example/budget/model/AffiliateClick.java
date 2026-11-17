package com.example.budget.model;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "affiliate_clicks")
public class AffiliateClick {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "component_id", nullable = false)
    private PcComponent component;

    @Enumerated(EnumType.STRING)
    @Column(name = "store_name", length = 32)
    private StoreType storeName;

    @Column(name = "target_url", nullable = false, length = 1024)
    private String targetUrl;

    @Column(name = "clicked_at", nullable = false)
    private Instant clickedAt = Instant.now();

    protected AffiliateClick() {
    }

    public AffiliateClick(PcComponent component, StoreType storeName, String targetUrl) {
        this.component = component;
        this.storeName = storeName;
        this.targetUrl = targetUrl;
        this.clickedAt = Instant.now();
    }

    public Long getId() { return id; }
    public PcComponent getComponent() { return component; }
    public StoreType getStoreName() { return storeName; }
    public String getTargetUrl() { return targetUrl; }
    public Instant getClickedAt() { return clickedAt; }
}