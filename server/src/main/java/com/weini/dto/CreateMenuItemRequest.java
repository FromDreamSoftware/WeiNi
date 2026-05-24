package com.weini.dto;

import jakarta.validation.constraints.NotBlank;

public record CreateMenuItemRequest(
    @NotBlank String dishName,
    String category,
    String imageUrl
) {}
