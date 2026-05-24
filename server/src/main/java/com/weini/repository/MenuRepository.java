package com.weini.repository;

import com.weini.entity.MenuItem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MenuRepository extends JpaRepository<MenuItem, Long> {

  List<MenuItem> findByIsActiveTrueOrderByCreatedAtDesc();

  List<MenuItem> findAllByOrderByCreatedAtDesc();
}
