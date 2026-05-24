package com.weini.repository;

import com.weini.entity.Snack;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.Optional;

public interface SnackRepository extends JpaRepository<Snack, Long> {

  @Query(value = "SELECT * FROM snacks WHERE stock > 0 AND status = 'AVAILABLE' ORDER BY RAND() LIMIT 1", nativeQuery = true)
  Optional<Snack> findRandomAvailable();
}
