package com.weini.dto;

public record UpdateProfileRequest(
    String nickname,
    String email,
    String avatarUrl
) {}
