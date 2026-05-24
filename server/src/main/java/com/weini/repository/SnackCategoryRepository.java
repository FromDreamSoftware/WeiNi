package com.weini.repository;

import com.weini.entity.SnackCategory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface SnackCategoryRepository extends JpaRepository<SnackCategory, Long> {
  Optional<SnackCategory> findByName(String name);
  boolean existsByName(String name);
}
