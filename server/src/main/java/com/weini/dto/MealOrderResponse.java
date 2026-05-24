package com.weini.dto;

import com.weini.entity.MealOrder;
import com.weini.entity.MealOrderStatus;
import com.weini.entity.MealType;

import java.time.LocalDate;
import java.time.LocalDateTime;

public record MealOrderResponse(
    Long id,
    LocalDate orderDate,
    MealType mealType,
    String dishName,
    String notes,
    MealOrderStatus status,
    String orderedByNickname,
    String handlerNickname,
    LocalDateTime createdAt,
    LocalDateTime completedAt
) {
  public static MealOrderResponse from(MealOrder order) {
    return new MealOrderResponse(
        order.getId(),
        order.getOrderDate(),
        order.getMealType(),
        order.getDishName(),
        order.getNotes(),
        order.getStatus(),
        order.getOrderedBy().getNickname(),
        order.getHandler() != null ? order.getHandler().getNickname() : null,
        order.getCreatedAt(),
        order.getCompletedAt()
    );
  }
}
