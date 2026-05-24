package com.weini.service;

import com.weini.dto.CreateSnackRequest;
import com.weini.dto.SnackRequestResponse;
import com.weini.entity.*;
import com.weini.repository.SnackRepository;
import com.weini.repository.SnackRequestRepository;
import com.weini.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@Transactional(readOnly = true)
public class SnackRequestService {

  private static final Logger log = LoggerFactory.getLogger(SnackRequestService.class);

  private final SnackRequestRepository requestRepository;
  private final SnackRepository snackRepository;
  private final UserRepository userRepository;
  private final NotificationService notificationService;
  private final SnackCategoryService snackCategoryService;
  private final EmailService emailService;

  public SnackRequestService(SnackRequestRepository requestRepository,
                             SnackRepository snackRepository,
                             UserRepository userRepository,
                             NotificationService notificationService,
                             SnackCategoryService snackCategoryService,
                             EmailService emailService) {
    this.requestRepository = requestRepository;
    this.snackRepository = snackRepository;
    this.userRepository = userRepository;
    this.notificationService = notificationService;
    this.snackCategoryService = snackCategoryService;
    this.emailService = emailService;
  }

  @Transactional
  public SnackRequestResponse create(Long requesterId, CreateSnackRequest req) {
    User requester = userRepository.findById(requesterId)
        .orElseThrow(() -> new IllegalArgumentException("用户不存在"));

    User assignee = userRepository.findById(req.assigneeId())
        .orElseThrow(() -> new IllegalArgumentException("审批人不存在"));

    SnackRequest entity = new SnackRequest();
    entity.setType(com.weini.entity.SnackRequestType.valueOf(req.type().name()));
    entity.setSnackName(req.snackName());
    entity.setCategoryName(req.categoryName());
    entity.setCount(req.count());
    entity.setReason(req.reason());
    entity.setRequester(requester);
    entity.setHandler(assignee);

    if (req.snackId() != null) {
      snackRepository.findById(req.snackId()).ifPresent(entity::setSnack);
    }

    SnackRequest saved = requestRepository.save(entity);
    log.info("snack_request_created id={} type={} snackName={}", saved.getId(), saved.getType(), saved.getSnackName());

    String typeCn = switch (saved.getType()) {
      case RESTOCK -> "补货";
      case ADD -> "新增";
      case REMOVE -> "下架";
    };
    notificationService.create(assignee.getId(), NotificationType.SNACK_REQUEST,
        "新的零食请求",
        requester.getNickname() + "请求" + typeCn + ": " + saved.getSnackName(),
        saved.getId(), "snack_request");

    emailService.sendTo(assignee.getRole(),
        "新的零食请求",
        requester.getNickname() + "请求" + typeCn + ": " + saved.getSnackName());

    return SnackRequestResponse.from(saved);
  }

  public Page<SnackRequestResponse> list(Long userId, String role, String view, Pageable pageable) {
    Page<SnackRequest> requests;
    if ("pending".equals(view)) {
      requests = requestRepository.findByHandlerIdOrderByCreatedAtDesc(userId, pageable);
    } else if ("my".equals(view)) {
      requests = requestRepository.findByRequesterIdOrderByCreatedAtDesc(userId, pageable);
    } else {
      // legacy fallback
      if ("BOYFRIEND".equals(role)) {
        requests = requestRepository.findByStatusInOrderByCreatedAtDesc(
            List.of(SnackRequestStatus.PENDING, SnackRequestStatus.IN_PROGRESS), pageable);
      } else {
        requests = requestRepository.findByRequesterIdOrderByCreatedAtDesc(userId, pageable);
      }
    }
    return requests.map(SnackRequestResponse::from);
  }

  @Transactional
  public SnackRequestResponse handle(Long requestId, String newStatus, Long handlerId) {
    SnackRequest request = requestRepository.findById(requestId)
        .orElseThrow(() -> new IllegalArgumentException("请求不存在"));

    if (request.getStatus() == SnackRequestStatus.COMPLETED || request.getStatus() == SnackRequestStatus.REJECTED) {
      throw new IllegalArgumentException("该请求已处理");
    }

    SnackRequestStatus currentStatus = request.getStatus();
    SnackRequestStatus status = SnackRequestStatus.valueOf(newStatus.toUpperCase());

    if (currentStatus == SnackRequestStatus.PENDING && status == SnackRequestStatus.COMPLETED) {
      throw new IllegalArgumentException("请先接单再标记完成");
    }

    if (status == SnackRequestStatus.COMPLETED && !handlerId.equals(request.getHandler().getId())) {
      throw new IllegalArgumentException("只有接单人才能完成");
    }

    if (status == SnackRequestStatus.IN_PROGRESS) {
      if (!handlerId.equals(request.getHandler().getId())) {
        throw new IllegalArgumentException("只有指定的处理人才能接单");
      }
    } else {
      User handler = userRepository.findById(handlerId)
          .orElseThrow(() -> new IllegalArgumentException("用户不存在"));
      request.setHandler(handler);
    }

    request.setStatus(status);

    if (status == SnackRequestStatus.COMPLETED) {
      request.setResolvedAt(LocalDateTime.now());
      applyRequest(request);
    } else if (status == SnackRequestStatus.REJECTED) {
      request.setResolvedAt(LocalDateTime.now());
    }

    log.info("snack_request_handled id={} status={}", requestId, status);

    Long requesterId = request.getRequester().getId();
    String statusCn = switch (status) {
      case IN_PROGRESS -> "进行中";
      case COMPLETED -> "已完成";
      case REJECTED -> "已拒绝";
      default -> "已处理";
    };
    notificationService.create(requesterId, NotificationType.SNACK_REQUEST,
        "零食请求已处理",
        "你的" + request.getSnackName() + "请求已被" + statusCn,
        request.getId(), "snack_request");

    if (status == SnackRequestStatus.COMPLETED) {
      User requester = request.getRequester();
      emailService.sendTo(requester.getRole(),
          "零食请求已完成",
          "你的「" + request.getSnackName() + "」请求已完成");
    }

    return SnackRequestResponse.from(request);
  }

  private void applyRequest(SnackRequest request) {
    switch (request.getType()) {
      case RESTOCK -> {
        Snack snack = request.getSnack();
        if (snack == null) throw new IllegalArgumentException("请指定零食");
        snack.setStock(snack.getStock() + request.getCount());
        snack.setStatus(SnackStatus.AVAILABLE);
        snackRepository.save(snack);
      }
      case REMOVE -> {
        Snack snack = request.getSnack();
        if (snack == null) throw new IllegalArgumentException("请指定零食");
        snack.setStatus(SnackStatus.UNAVAILABLE);
        snackRepository.save(snack);
      }
      case ADD -> {
        String categoryName = request.getCategoryName() != null ? request.getCategoryName() : "其他";
        snackCategoryService.ensureExists(categoryName);
        Snack snack = new Snack();
        snack.setName(request.getSnackName());
        snack.setCategory(categoryName);
        snack.setStock(request.getCount());
        snack.setStatus(SnackStatus.AVAILABLE);
        snackRepository.save(snack);
      }
    }
  }
}
