package com.weini.dto;

import com.weini.entity.*;

import java.time.LocalDateTime;

public record WorkOrderResponse(
    Long id,
    String title,
    String description,
    WorkOrderCategory category,
    WorkOrderPriority priority,
    WorkOrderStatus status,
    String creatorNickname,
    String handlerNickname,
    String handlerNote,
    LocalDateTime createdAt,
    LocalDateTime resolvedAt
) {
  public static WorkOrderResponse from(WorkOrder wo) {
    return new WorkOrderResponse(
        wo.getId(),
        wo.getTitle(),
        wo.getDescription(),
        wo.getCategory(),
        wo.getPriority(),
        wo.getStatus(),
        wo.getCreator().getNickname(),
        wo.getHandler() != null ? wo.getHandler().getNickname() : null,
        wo.getHandlerNote(),
        wo.getCreatedAt(),
        wo.getResolvedAt()
    );
  }
}
