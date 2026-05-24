package com.weini.dto;

import com.weini.entity.Photo;

import java.time.LocalDateTime;
import java.util.List;

public record PhotoResponse(
    Long id,
    String imageUrl,
    String caption,
    String tags,
    String uploaderNickname,
    LocalDateTime createdAt,
    List<CommentResponse> comments
) {
  public static PhotoResponse from(Photo photo, String url, List<CommentResponse> comments) {
    return new PhotoResponse(
        photo.getId(), url, photo.getCaption(), photo.getTags(),
        photo.getUploadedBy().getNickname(), photo.getCreatedAt(), comments);
  }
}
