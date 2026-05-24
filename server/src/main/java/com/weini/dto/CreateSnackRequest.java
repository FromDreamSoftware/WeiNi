package com.weini.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record CreateSnackRequest(
    @NotNull SnackRequestType type,
    Long snackId,
    @NotBlank String snackName,
    String categoryName,
    @NotNull int count,
    String reason,
    @NotNull Long assigneeId
) {
  public enum SnackRequestType {
    RESTOCK, ADD, REMOVE
  }
}
