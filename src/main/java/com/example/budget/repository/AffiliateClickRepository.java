package com.example.budget.repository;

import com.example.budget.model.AffiliateClick;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface AffiliateClickRepository extends JpaRepository<AffiliateClick, Long> {

    long countByComponentId(Long componentId);

    @Query("""
            SELECT c.component.id AS componentId,
                   c.component.name AS componentName,
                   c.storeName AS storeName,
                   COUNT(c) AS clicks
            FROM AffiliateClick c
            GROUP BY c.component.id, c.component.name, c.storeName
            ORDER BY COUNT(c) DESC
            """)
    List<ClickStatRow> findClickStats();

    interface ClickStatRow {
        Long getComponentId();
        String getComponentName();
        com.example.budget.model.StoreType getStoreName();
        long getClicks();
    }
}