package com.example.budget.repository;

import com.example.budget.model.PcComponent;
import org.springframework.data.jpa.repository.JpaRepository;
import com.example.budget.model.ComponentType;
import java.util.List;

public interface PcComponentRepository extends JpaRepository<PcComponent, Long> {
    List<PcComponent> findByTypeAndInStockTrue(ComponentType type);

    List<PcComponent> findAllByOrderBySponsoredDescSponsorPriorityDescIdAsc();

    List<PcComponent> findByTypeOrderBySponsoredDescSponsorPriorityDescIdAsc(ComponentType type);
}
