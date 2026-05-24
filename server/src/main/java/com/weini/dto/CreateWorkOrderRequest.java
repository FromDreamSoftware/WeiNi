package com.weini.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record CreateWorkOrderRequest(
    @NotBlank String title,
    String description,
    @NotNull WorkCategory category,
    WorkPriority priority,
    @NotNull Long assigneeId
) {
  public enum WorkCategory { BUG, FEATURE, COMPLAINT, WISH }
  public enum WorkPriority { LOW, MEDIUM, HIGH }
}
