package com.weini.dto;

import com.weini.entity.AnniversaryType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;

public record CreateAnniversaryRequest(
    @NotBlank String title,
    @NotNull LocalDate eventDate,
    @NotNull AnniversaryType type,
    String customType,
    String icon
) {}
