package com.weini.dto;

public record LoginResponse(
    String accessToken,
    String refreshToken,
    Long userId,
    String username,
    String nickname,
    String role,
    String avatarUrl,
    String email
) {}
