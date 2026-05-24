package com.weini.dto;

import com.weini.entity.WishlistCategory;
import com.weini.entity.WishlistItem;
import com.weini.entity.WishlistStatus;

import java.time.LocalDateTime;

public record WishlistResponse(
    Long id,
    String title,
    String description,
    String imageUrl,
    WishlistCategory category,
    WishlistStatus status,
    String creatorNickname,
    String achieverNickname,
    String achievedPhotoUrl,
    LocalDateTime achievedAt,
    LocalDateTime createdAt
) {
  public static WishlistResponse from(WishlistItem item, String imageUrl, String achievedPhotoUrl) {
    return new WishlistResponse(
        item.getId(),
        item.getTitle(),
        item.getDescription(),
        imageUrl,
        item.getCategory(),
        item.getStatus(),
        item.getCreatedBy().getNickname(),
        item.getAchievedBy() != null ? item.getAchievedBy().getNickname() : null,
        achievedPhotoUrl,
        item.getAchievedAt(),
        item.getCreatedAt()
    );
  }
}
