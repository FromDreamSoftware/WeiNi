package com.weini.dto;

import com.weini.entity.SnackCategory;

public record SnackCategoryResponse(
    Long id,
    String name
) {
  public static SnackCategoryResponse from(SnackCategory c) {
    return new SnackCategoryResponse(c.getId(), c.getName());
  }
}
