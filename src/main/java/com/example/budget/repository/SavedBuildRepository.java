package com.example.budget.repository;

import com.example.budget.model.SavedBuild;
import com.example.budget.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SavedBuildRepository extends JpaRepository<SavedBuild, Long> {
    List<SavedBuild> findByUser(User user);
}