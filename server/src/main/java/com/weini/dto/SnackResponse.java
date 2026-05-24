package com.weini.dto;

import com.weini.entity.Snack;
import com.weini.entity.SnackStatus;

public record SnackResponse(
    Long id,
    String name,
    String category,
    String imageUrl,
    int stock,
    SnackStatus status
) {
  public static SnackResponse from(Snack s) {
    return new SnackResponse(
        s.getId(), s.getName(), s.getCategory(), s.getImageUrl(), s.getStock(), s.getStatus());
  }

  public static SnackResponse from(Snack s, String presignedUrl) {
    return new SnackResponse(
        s.getId(), s.getName(), s.getCategory(), presignedUrl, s.getStock(), s.getStatus());
  }
}
