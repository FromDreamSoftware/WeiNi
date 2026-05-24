package com.weini.repository;

import com.weini.entity.MealOrder;
import com.weini.entity.MealOrderStatus;
import com.weini.entity.MealType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public interface MealOrderRepository extends JpaRepository<MealOrder, Long> {

  List<MealOrder> findByOrderDateAndMealTypeOrderByCreatedAtDesc(LocalDate orderDate, MealType mealType);
  Page<MealOrder> findByOrderDateAndMealTypeOrderByCreatedAtDesc(LocalDate orderDate, MealType mealType, Pageable pageable);

  List<MealOrder> findByOrderDateOrderByCreatedAtDesc(LocalDate orderDate);
  Page<MealOrder> findByOrderDateOrderByCreatedAtDesc(LocalDate orderDate, Pageable pageable);

  List<MealOrder> findByStatusOrderByCreatedAtDesc(MealOrderStatus status);
  Page<MealOrder> findByStatusOrderByCreatedAtDesc(MealOrderStatus status, Pageable pageable);

  List<MealOrder> findByOrderedByIdOrderByCreatedAtDesc(Long userId);

  List<MealOrder> findByHandlerIdAndCreatedAtAfterOrderByCreatedAtDesc(Long handlerId, LocalDateTime since);

  List<MealOrder> findByOrderedByIdAndCreatedAtAfterOrderByCreatedAtDesc(Long userId, LocalDateTime since);

  Page<MealOrder> findByHandlerIdOrderByCreatedAtDesc(Long handlerId, Pageable pageable);

  Page<MealOrder> findByOrderedByIdOrderByCreatedAtDesc(Long userId, Pageable pageable);
}
