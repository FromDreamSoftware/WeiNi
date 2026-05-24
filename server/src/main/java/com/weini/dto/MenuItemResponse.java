package com.weini.dto;

import com.weini.entity.MenuItem;

import java.time.LocalDateTime;

public record MenuItemResponse(
    Long id,
    String dishName,
    String category,
    String imageUrl,
    boolean isActive,
    LocalDateTime createdAt
) {
  public static MenuItemResponse from(MenuItem item) {
    return new MenuItemResponse(
        item.getId(), item.getDishName(), item.getCategory(),
        item.getImageUrl(), item.isActive(), item.getCreatedAt());
  }

  public static MenuItemResponse from(MenuItem item, String presignedUrl) {
    return new MenuItemResponse(
        item.getId(), item.getDishName(), item.getCategory(),
        presignedUrl, item.isActive(), item.getCreatedAt());
  }
}
