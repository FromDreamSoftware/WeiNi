package com.weini.service;

import com.weini.dto.CreateWorkOrderRequest;
import com.weini.dto.WorkOrderResponse;
import com.weini.entity.*;
import com.weini.repository.UserRepository;
import com.weini.repository.WorkOrderRepository;
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
public class WorkOrderService {

  private static final Logger log = LoggerFactory.getLogger(WorkOrderService.class);

  private final WorkOrderRepository workOrderRepository;
  private final UserRepository userRepository;
  private final NotificationService notificationService;
  private final EmailService emailService;

  public WorkOrderService(WorkOrderRepository workOrderRepository, UserRepository userRepository,
                          NotificationService notificationService, EmailService emailService) {
    this.workOrderRepository = workOrderRepository;
    this.userRepository = userRepository;
    this.notificationService = notificationService;
    this.emailService = emailService;
  }

  @Transactional
  public WorkOrderResponse create(Long creatorId, CreateWorkOrderRequest req) {
    User creator = userRepository.findById(creatorId)
        .orElseThrow(() -> new IllegalArgumentException("用户不存在"));

    User assignee = userRepository.findById(req.assigneeId())
        .orElseThrow(() -> new IllegalArgumentException("审批人不存在"));

    WorkOrder wo = new WorkOrder();
    wo.setTitle(req.title());
    wo.setDescription(req.description());
    wo.setCategory(WorkOrderCategory.valueOf(req.category().name()));
    wo.setPriority(req.priority() != null
        ? WorkOrderPriority.valueOf(req.priority().name())
        : WorkOrderPriority.MEDIUM);
    wo.setCreator(creator);
    wo.setHandler(assignee);

    wo = workOrderRepository.save(wo);
    log.info("work_order_created id={} title={} category={}", wo.getId(), wo.getTitle(), wo.getCategory());

    notificationService.create(assignee.getId(), NotificationType.WORK_ORDER,
        "新的工单",
        creator.getNickname() + "提交了工单: " + wo.getTitle(),
        wo.getId(), "work_order");

    emailService.sendTo(assignee.getRole(),
        "新的工单",
        creator.getNickname() + "提交了工单: " + wo.getTitle());

    return WorkOrderResponse.from(wo);
  }

  public Page<WorkOrderResponse> list(Long userId, String role, String view, String period, Pageable pageable) {
    LocalDateTime since = periodStart(period);
    Page<WorkOrder> orders;
    if ("pending".equals(view)) {
      orders = workOrderRepository.findByHandlerIdAndCreatedAtAfterOrderByCreatedAtDesc(userId, since, pageable);
    } else if ("my".equals(view)) {
      orders = workOrderRepository.findByCreatorIdAndCreatedAtAfterOrderByCreatedAtDesc(userId, since, pageable);
    } else {
      if ("BOYFRIEND".equals(role)) {
        orders = workOrderRepository.findAll(pageable);
      } else {
        orders = workOrderRepository.findByCreatorIdOrderByCreatedAtDesc(userId, pageable);
      }
    }
    return orders.map(WorkOrderResponse::from);
  }

  private LocalDateTime periodStart(String period) {
    if (period == null) return LocalDateTime.of(2000, 1, 1, 0, 0);
    LocalDateTime now = LocalDateTime.now();
    return switch (period) {
      case "quarter" -> now.minusMonths(3);
      case "year" -> now.minusYears(1);
      default -> now.minusMonths(1);
    };
  }

  @Transactional
  public WorkOrderResponse handle(Long orderId, String newStatus, String handlerNote, Long handlerId) {
    WorkOrder wo = workOrderRepository.findById(orderId)
        .orElseThrow(() -> new IllegalArgumentException("工单不存在"));

    User handler = userRepository.findById(handlerId)
        .orElseThrow(() -> new IllegalArgumentException("用户不存在"));

    if (!wo.getHandler().getId().equals(handlerId)) {
      throw new IllegalArgumentException("只有处理人才能更新工单状态");
    }

    WorkOrderStatus status = WorkOrderStatus.valueOf(newStatus.toUpperCase());
    wo.setStatus(status);
    wo.setHandler(handler);

    if (status == WorkOrderStatus.DONE || status == WorkOrderStatus.REJECTED) {
      wo.setResolvedAt(LocalDateTime.now());
    }
    if (handlerNote != null && !handlerNote.isBlank()) {
      wo.setHandlerNote(handlerNote);
    }

    log.info("work_order_handled id={} status={}", orderId, status);

    String statusCn = switch (status) {
      case ACCEPTED -> "已受理";
      case IN_PROGRESS -> "处理中";
      case DONE -> "已完成";
      case REJECTED -> "已拒绝";
      default -> "已更新";
    };
    notificationService.create(wo.getCreator().getId(), NotificationType.WORK_ORDER,
        "工单状态更新",
        "你的工单「" + wo.getTitle() + "」状态更新为：" + statusCn,
        wo.getId(), "work_order");

    if (status == WorkOrderStatus.DONE) {
      emailService.sendTo(wo.getCreator().getRole(),
          "工单已完成",
          "你的工单「" + wo.getTitle() + "」已完成");
    }

    return WorkOrderResponse.from(wo);
  }
}
