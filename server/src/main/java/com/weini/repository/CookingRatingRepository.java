package com.weini.repository;

import com.weini.entity.CookingRating;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CookingRatingRepository extends JpaRepository<CookingRating, Long> {

  List<CookingRating> findByCookingRecordIdOrderByCreatedAtAsc(Long recordId);

  Optional<CookingRating> findByCookingRecordIdAndRaterId(Long recordId, Long raterId);
}
