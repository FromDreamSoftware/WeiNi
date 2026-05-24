package com.weini.repository;

import com.weini.entity.CookingRecord;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CookingRecordRepository extends JpaRepository<CookingRecord, Long> {

  List<CookingRecord> findAllByOrderByCookingDateDescCreatedAtDesc();
}
