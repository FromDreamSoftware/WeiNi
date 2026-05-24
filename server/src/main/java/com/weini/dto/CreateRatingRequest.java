package com.weini.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record CreateRatingRequest(
    @NotNull @Min(1) @Max(5) int rating,
    String comment
) {}
