package com.weini.dto;

import jakarta.validation.constraints.NotBlank;

public record MoodCheckinRequest(
    @NotBlank String moodEmoji,
    String note
) {}
