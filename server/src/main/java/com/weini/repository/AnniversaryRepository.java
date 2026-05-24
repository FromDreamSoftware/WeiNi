package com.weini.repository;

import com.weini.entity.Anniversary;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface AnniversaryRepository extends JpaRepository<Anniversary, Long> {

  List<Anniversary> findAllByOrderByEventDateAsc();
}
