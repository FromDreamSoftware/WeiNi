package com.weini.dto;

public record UpdateWishlistRequest(
    String title,
    String description,
    WishCategory category
) {
  public enum WishCategory { TRAVEL, FOOD, THING, EXPERIENCE, OTHER }
}
