package com.weini.dto;

import jakarta.validation.constraints.NotBlank;

public record CreateWishlistRequest(
    @NotBlank String title,
    String description,
    WishCategory category
) {
  public enum WishCategory { TRAVEL, FOOD, THING, EXPERIENCE, OTHER }
}
