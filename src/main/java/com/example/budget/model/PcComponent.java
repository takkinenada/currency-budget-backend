package com.example.budget.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.math.BigDecimal;

/**
 * Комплектуюча ПК з каталогу (таблиця {@code components}, міграції V3 і далі).
 * Одна таблиця для всіх категорій; поля, що не стосуються категорії, порожні.
 */
@Entity
@Table(name = "components")
public class PcComponent {

    @Enumerated(EnumType.STRING)
    @Column(name = "store_name", length = 32)
    private StoreType storeName;

    @Column(name = "in_stock", nullable = false)
    private boolean inStock = true;

    @Column(name = "price_updated_at")
    private Instant priceUpdatedAt;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(name = "category", nullable = false, length = 20)
    private ComponentType type;

    @Column(nullable = false, length = 150)
    private String name;

    @Column(name = "short_spec", length = 100)
    private String shortSpec;

    /** Для CPU і GPU це виробник чипа (AMD, Intel, NVIDIA), для решти виробник пристрою (MSI, Gigabyte, Kingston). */
    @Column(nullable = false, length = 50)
    private String brand;

    @Column(name = "price_uah", nullable = false, precision = 19, scale = 2)
    private BigDecimal priceUah;

    /** Сокет: для CPU і материнської плати. */
    @Column(length = 30)
    private String socket;

    /** Тип пам'яті: для CPU, материнської плати і ОЗП. */
    @Enumerated(EnumType.STRING)
    @Column(name = "memory_type", length = 10)
    private MemoryType memoryType;

    /** Для CPU і GPU це TDP (Вт), для блока живлення його потужність (Вт). */
    @Column(name = "tdp_watts")
    private Integer tdpWatts;

    /** Для плати її типорозмір, для корпусу максимальний типорозмір плати ("ATX", "Micro-ATX"). */
    @Column(name = "form_factor", length = 30)
    private String formFactor;

    /** Для відеокарти її довжина, для корпусу максимальна довжина відеокарти (мм). */
    @Column(name = "length_mm")
    private Integer lengthMm;

    @Column(name = "gaming_score", nullable = false)
    private int gamingScore;

    @Column(name = "work_score", nullable = false)
    private int workScore;

    @Column(name = "tech_score", nullable = false)
    private int techScore;

    @Column(name = "shop_url", length = 1024)
    private String shopUrl;

    protected PcComponent() {
    }

    public PcComponent(ComponentType type, String name, String brand, BigDecimal priceUah,
                       String socket, MemoryType memoryType, Integer tdpWatts,
                       String formFactor, Integer lengthMm,
                       int gamingScore, int workScore, int techScore) {
        this.type = type;
        this.name = name;
        this.brand = brand;
        this.priceUah = priceUah;
        this.socket = socket;
        this.memoryType = memoryType;
        this.tdpWatts = tdpWatts;
        this.formFactor = formFactor;
        this.lengthMm = lengthMm;
        this.gamingScore = gamingScore;
        this.workScore = workScore;
        this.techScore = techScore;
    }

    public Long getId() {
        return id;
    }

    public ComponentType getType() {
        return type;
    }

    public String getName() {
        return name;
    }

    public String getShortSpec() {
        return shortSpec;
    }

    public String getBrand() {
        return brand;
    }

    public BigDecimal getPriceUah() {
        return priceUah;
    }

    public String getSocket() {
        return socket;
    }

    public MemoryType getMemoryType() {
        return memoryType;
    }

    public Integer getTdpWatts() {
        return tdpWatts;
    }

    public String getFormFactor() {
        return formFactor;
    }

    public FormFactor getFormFactorEnum() {
        return FormFactor.fromLabel(formFactor);
    }

    public Integer getLengthMm() {
        return lengthMm;
    }

    public int getGamingScore() {
        return gamingScore;
    }

    public int getWorkScore() {
        return workScore;
    }

    public int getTechScore() {
        return techScore;
    }

    public String getShopUrl() {
        return shopUrl;
    }

    public StoreType getStoreName() {
        return storeName;
    }

    public boolean isInStock() {
        return inStock;
    }

    public Instant getPriceUpdatedAt() {
        return priceUpdatedAt;
    }

    public void setPriceUah(BigDecimal priceUah) {
        this.priceUah = priceUah;
    }

    public void setShopUrl(String shopUrl) {
        this.shopUrl = shopUrl;
    }

    public void setStoreName(StoreType storeName) {
        this.storeName = storeName;
    }

    public void setInStock(boolean inStock) {
        this.inStock = inStock;
    }

    public void setPriceUpdatedAt(Instant priceUpdatedAt) {
        this.priceUpdatedAt = priceUpdatedAt;
    }

    @Override
    public String toString() {
        return type + ": " + name;
    }

    @Column(nullable = false)
    private boolean sponsored = false;

    @Column(name = "promo_label", length = 64)
    private String promoLabel;

    @Column(name = "sponsor_priority", nullable = false)
    private int sponsorPriority = 0;

    public boolean isSponsored() { return sponsored; }
    public void setSponsored(boolean sponsored) { this.sponsored = sponsored; }

    public String getPromoLabel() { return promoLabel; }
    public void setPromoLabel(String promoLabel) { this.promoLabel = promoLabel; }

    public int getSponsorPriority() { return sponsorPriority; }
    public void setSponsorPriority(int sponsorPriority) { this.sponsorPriority = sponsorPriority; }
}
