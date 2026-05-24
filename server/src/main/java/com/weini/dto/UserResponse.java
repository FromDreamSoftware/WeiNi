package com.weini.dto;

import com.weini.entity.User;

public record UserResponse(
    Long id,
    String username,
    String nickname,
    String role,
    String avatarUrl,
    String email
) {
  public static UserResponse from(User user) {
    return new UserResponse(
        user.getId(),
        user.getUsername(),
        user.getNickname(),
        user.getRole().name(),
        user.getAvatarUrl(),
        user.getEmail()
    );
  }
}
