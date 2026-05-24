package com.weini.dto;

import com.weini.entity.ChatMessage;
import java.time.LocalDateTime;

public record ChatMessageResponse(
    Long id,
    String role,
    String content,
    LocalDateTime createdAt
) {
  public static ChatMessageResponse from(ChatMessage m) {
    return new ChatMessageResponse(
        m.getId(),
        m.getRole().name().toLowerCase(),
        m.getContent(),
        m.getCreatedAt()
    );
  }
}
