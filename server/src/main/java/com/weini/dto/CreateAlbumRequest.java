package com.weini.dto;

import jakarta.validation.constraints.NotBlank;

public record CreateAlbumRequest(@NotBlank String title) {}
