package com.example.budget.model;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(
        name = "saved_builds",
        indexes = {
                @Index(name = "idx_saved_builds_user_id", columnList = "user_id")
        }
)
public class SavedBuild {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false, length = 32)
    private String scenario = "GAMING";

    @Column(name = "total_saved_price_uah", nullable = false, precision = 12, scale = 2)
    private BigDecimal totalSavedPriceUah;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @OneToMany(mappedBy = "savedBuild", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<SavedBuildItem> items = new ArrayList<>();

    @PrePersist
    protected void onCreate() {
        if (this.createdAt == null) {
            this.createdAt = LocalDateTime.now();
        }
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getScenario() { return scenario; }
    public void setScenario(String scenario) { this.scenario = scenario; }

    public BigDecimal getTotalSavedPriceUah() { return totalSavedPriceUah; }
    public void setTotalSavedPriceUah(BigDecimal totalSavedPriceUah) { this.totalSavedPriceUah = totalSavedPriceUah; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public List<SavedBuildItem> getItems() { return items; }
    public void setItems(List<SavedBuildItem> items) { this.items = items; }
}