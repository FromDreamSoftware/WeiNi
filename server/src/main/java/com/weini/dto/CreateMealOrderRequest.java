package com.weini.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

public record CreateMealOrderRequest(
    @NotNull LocalDate orderDate,
    @NotNull MealOrderType mealType,
    @NotBlank String dishName,
    String notes,
    @NotNull Long assigneeId
) {
  public enum MealOrderType {
    BREAKFAST, LUNCH, DINNER
  }
}
