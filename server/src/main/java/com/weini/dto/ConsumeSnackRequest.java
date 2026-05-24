package com.weini.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record ConsumeSnackRequest(
    @NotNull @Min(1) int count
) {}
