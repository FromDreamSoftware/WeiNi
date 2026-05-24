package com.weini.repository;

import com.weini.entity.WishlistCategory;
import com.weini.entity.WishlistItem;
import com.weini.entity.WishlistStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface WishlistRepository extends JpaRepository<WishlistItem, Long> {



  List<WishlistItem> findAllByOrderByCreatedAtDesc();

  List<WishlistItem> findByCreatedByIdOrderByCreatedAtDesc(Long userId);

  @Query("SELECT w FROM WishlistItem w WHERE " +
         "(:status IS NULL OR w.status = :status) AND " +
         "(:category IS NULL OR w.category = :category)")
  Page<WishlistItem> findByFilters(@Param("status") WishlistStatus status,
                                   @Param("category") WishlistCategory category,
                                   Pageable pageable);
}
