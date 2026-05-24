package com.weini.dto;

import jakarta.validation.constraints.NotBlank;

public record CreateCommentRequest(@NotBlank String content) {}
