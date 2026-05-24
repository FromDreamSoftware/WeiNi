package com.weini.dto;

import com.weini.entity.CookingRecord;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public record CookingRecordResponse(
    Long id,
    LocalDate cookingDate,
    String dishName,
    String photoUrl,
    String note,
    String chefNickname,
    Long mealOrderId,
    LocalDateTime createdAt,
    List<RatingResponse> ratings,
    double averageRating
) {
  public static CookingRecordResponse from(CookingRecord cr, String photoUrl, List<RatingResponse> ratings) {
    String dishName = cr.getNote();
    if (cr.getMealOrder() != null) {
      dishName = cr.getMealOrder().getDishName();
    }
    double avg = ratings.stream().mapToInt(RatingResponse::rating).average().orElse(0);
    return new CookingRecordResponse(
        cr.getId(),
        cr.getCookingDate(),
        dishName,
        photoUrl,
        cr.getNote(),
        cr.getChef().getNickname(),
        cr.getMealOrder() != null ? cr.getMealOrder().getId() : null,
        cr.getCreatedAt(),
        ratings,
        Math.round(avg * 10) / 10.0
    );
  }
}
