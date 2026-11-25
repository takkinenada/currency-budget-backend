package com.example.budget.model;

import jakarta.persistence.*;
import java.math.BigDecimal;

@Entity
@Table(
        name = "saved_build_items",
        indexes = {
                @Index(name = "idx_saved_build_items_build_id", columnList = "saved_build_id")
        }
)
public class SavedBuildItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "saved_build_id", nullable = false)
    private SavedBuild savedBuild;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "component_id", nullable = false)
    private PcComponent component;

    @Column(nullable = false, length = 32)
    private String category;

    @Column(name = "saved_price_uah", nullable = false, precision = 12, scale = 2)
    private BigDecimal savedPriceUah;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public SavedBuild getSavedBuild() { return savedBuild; }
    public void setSavedBuild(SavedBuild savedBuild) { this.savedBuild = savedBuild; }

    public PcComponent getComponent() { return component; }
    public void setComponent(PcComponent component) { this.component = component; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public BigDecimal getSavedPriceUah() { return savedPriceUah; }
    public void setSavedPriceUah(BigDecimal savedPriceUah) { this.savedPriceUah = savedPriceUah; }
}