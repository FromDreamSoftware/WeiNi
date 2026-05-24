package com.weini.dto;

import java.time.LocalDate;

public record UpdateMealOrderRequest(
    LocalDate orderDate,
    String mealType,
    String dishName,
    String notes
) {}
