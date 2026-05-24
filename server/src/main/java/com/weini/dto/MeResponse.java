package com.weini.dto;

public record MeResponse(
    Long id,
    String username,
    String nickname,
    String role,
    String avatarUrl,
    String email
) {}
