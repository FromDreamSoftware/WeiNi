package com.weini.dto;

import com.weini.entity.PhotoComment;

import java.time.LocalDateTime;

public record CommentResponse(
    Long id,
    String content,
    String userNickname,
    LocalDateTime createdAt
) {
  public static CommentResponse from(PhotoComment comment) {
    return new CommentResponse(
        comment.getId(), comment.getContent(), comment.getUser().getNickname(), comment.getCreatedAt());
  }
}
