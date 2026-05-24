package com.weini.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

public record CreateCookingRecordRequest(
    @NotNull LocalDate cookingDate,
    @NotBlank String dishName,
    String note,
    Long mealOrderId
) {}
