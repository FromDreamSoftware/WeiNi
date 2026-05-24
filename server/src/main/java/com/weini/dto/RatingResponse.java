package com.weini.dto;

import com.weini.entity.CookingRating;

import java.time.LocalDateTime;

public record RatingResponse(
    Long id,
    int rating,
    String comment,
    String raterNickname,
    LocalDateTime createdAt
) {
  public static RatingResponse from(CookingRating r) {
    return new RatingResponse(
        r.getId(), r.getRating(), r.getComment(),
        r.getRater().getNickname(), r.getCreatedAt());
  }
}
