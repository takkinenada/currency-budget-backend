package com.example.budget.repository;

import com.example.budget.model.ComponentOffer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface ComponentOfferRepository extends JpaRepository<ComponentOffer, Long> {

    List<ComponentOffer> findByComponentIdOrderByInStockDescPriceUahAsc(Long componentId);

    @Query("SELECT o FROM ComponentOffer o JOIN FETCH o.component")
    List<ComponentOffer> findAllWithComponent();
}