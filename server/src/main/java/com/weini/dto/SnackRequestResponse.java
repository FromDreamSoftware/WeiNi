package com.weini.dto;

import com.weini.entity.SnackRequest;
import com.weini.entity.SnackRequestStatus;
import com.weini.entity.SnackRequestType;

import java.time.LocalDateTime;

public record SnackRequestResponse(
    Long id,
    SnackRequestType type,
    String snackName,
    String categoryName,
    int count,
    String reason,
    SnackRequestStatus status,
    String requesterNickname,
    String handlerNickname,
    LocalDateTime createdAt,
    LocalDateTime resolvedAt
) {
  public static SnackRequestResponse from(SnackRequest r) {
    return new SnackRequestResponse(
        r.getId(),
        r.getType(),
        r.getSnackName(),
        r.getCategoryName(),
        r.getCount(),
        r.getReason(),
        r.getStatus(),
        r.getRequester().getNickname(),
        r.getHandler() != null ? r.getHandler().getNickname() : null,
        r.getCreatedAt(),
        r.getResolvedAt()
    );
  }
}
