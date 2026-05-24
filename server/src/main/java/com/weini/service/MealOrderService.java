package com.weini.service;

import com.weini.dto.CreateMealOrderRequest;
import com.weini.dto.MealOrderResponse;
import com.weini.dto.UpdateMealOrderRequest;
import com.weini.entity.*;
import com.weini.repository.MealOrderRepository;
import com.weini.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
@Transactional(readOnly = true)
public class MealOrderService {

  private static final Logger log = LoggerFactory.getLogger(MealOrderService.class);

  private final MealOrderRepository orderRepository;
  private final UserRepository userRepository;
  private final NotificationService notificationService;
  private final EmailService emailService;

  public MealOrderService(MealOrderRepository orderRepository, UserRepository userRepository,
                          NotificationService notificationService, EmailService emailService) {
    this.orderRepository = orderRepository;
    this.userRepository = userRepository;
    this.notificationService = notificationService;
    this.emailService = emailService;
  }

  @Transactional
  public MealOrderResponse create(Long userId, CreateMealOrderRequest req) {
    User user = userRepository.findById(userId)
        .orElseThrow(() -> new IllegalArgumentException("用户不存在"));

    User assignee = userRepository.findById(req.assigneeId())
        .orElseThrow(() -> new IllegalArgumentException("审批人不存在"));

    MealOrder order = new MealOrder();
    order.setOrderDate(req.orderDate());
    order.setMealType(MealType.valueOf(req.mealType().name()));
    order.setDishName(req.dishName());
    order.setNotes(req.notes());
    order.setOrderedBy(user);
    order.setHandler(assignee);

    order = orderRepository.save(order);
    log.info("meal_order_created id={} dishName={} mealType={}", order.getId(), order.getDishName(), order.getMealType());

    notificationService.create(assignee.getId(), NotificationType.MEAL_ORDER,
        "新的点菜请求",
        user.getNickname() + "点了: " + order.getDishName(),
        order.getId(), "meal_order");

    emailService.sendTo(assignee.getRole(),
        "新的点菜请求",
        user.getNickname() + "点了: " + order.getDishName());

    return MealOrderResponse.from(order);
  }

  public Page<MealOrderResponse> list(String role, LocalDate date, String mealType, String status, Long userId,
                                       String view, Pageable pageable) {
    if (status != null) {
      MealOrderStatus orderStatus = MealOrderStatus.valueOf(status.toUpperCase());
      return orderRepository.findByStatusOrderByCreatedAtDesc(orderStatus, pageable)
          .map(MealOrderResponse::from);
    }
    if (date != null && mealType != null) {
      return orderRepository.findByOrderDateAndMealTypeOrderByCreatedAtDesc(date, MealType.valueOf(mealType), pageable)
          .map(MealOrderResponse::from);
    }
    if (date != null) {
      return orderRepository.findByOrderDateOrderByCreatedAtDesc(date, pageable)
          .map(MealOrderResponse::from);
    }

    Page<MealOrder> orders;
    if ("pending".equals(view)) {
      orders = orderRepository.findByHandlerIdOrderByCreatedAtDesc(userId, pageable);
    } else if ("my".equals(view)) {
      orders = orderRepository.findByOrderedByIdOrderByCreatedAtDesc(userId, pageable);
    } else if ("GIRLFRIEND".equals(role)) {
      orders = orderRepository.findByOrderedByIdOrderByCreatedAtDesc(userId, pageable);
    } else {
      orders = orderRepository.findAll(pageable);
    }
    return orders.map(MealOrderResponse::from);
  }

  @Transactional
  public MealOrderResponse updateStatus(Long orderId, String newStatus, Long userId) {
    MealOrder order = orderRepository.findById(orderId)
        .orElseThrow(() -> new IllegalArgumentException("订单不存在"));

    if (!order.getHandler().getId().equals(userId)) {
      throw new IllegalArgumentException("只有处理人才能更新订单状态");
    }

    MealOrderStatus status = MealOrderStatus.valueOf(newStatus.toUpperCase());
    order.setStatus(status);

    if (status == MealOrderStatus.COMPLETED || status == MealOrderStatus.DONE) {
      order.setCompletedAt(LocalDateTime.now());
    }

    log.info("meal_order_updated id={} status={}", orderId, status);

    String statusCn = switch (status) {
      case IN_PROGRESS, COOKING -> "进行中";
      case COMPLETED, DONE -> "已完成";
      case REJECTED -> "已拒绝";
      default -> "待处理";
    };
    notificationService.create(order.getOrderedBy().getId(), NotificationType.MEAL_ORDER,
        "订单状态更新",
        "你的「" + order.getDishName() + "」状态更新为：" + statusCn,
        order.getId(), "meal_order");

    if (status == MealOrderStatus.COMPLETED || status == MealOrderStatus.DONE) {
      emailService.sendTo(order.getOrderedBy().getRole(),
          "点菜订单已完成",
          "你的「" + order.getDishName() + "」已做好啦，快来吃吧！");
    }

    return MealOrderResponse.from(order);
  }

  @Transactional
  public MealOrderResponse update(Long orderId, Long userId, UpdateMealOrderRequest req) {
    MealOrder order = orderRepository.findById(orderId)
        .orElseThrow(() -> new IllegalArgumentException("订单不存在"));

    if (order.getStatus() != MealOrderStatus.PENDING) {
      throw new IllegalArgumentException("只能修改待处理状态的订单");
    }
    if (!order.getOrderedBy().getId().equals(userId)) {
      throw new IllegalArgumentException("只能修改自己的订单");
    }

    if (req.orderDate() != null) order.setOrderDate(req.orderDate());
    if (req.mealType() != null) order.setMealType(MealType.valueOf(req.mealType()));
    if (req.dishName() != null) order.setDishName(req.dishName());
    order.setNotes(req.notes());

    log.info("meal_order_updated id={}", orderId);
    return MealOrderResponse.from(order);
  }

  @Transactional
  public void cancel(Long orderId, Long userId) {
    MealOrder order = orderRepository.findById(orderId)
        .orElseThrow(() -> new IllegalArgumentException("订单不存在"));

    if (order.getStatus() != MealOrderStatus.PENDING) {
      throw new IllegalArgumentException("只能取消待处理状态的订单");
    }
    if (!order.getOrderedBy().getId().equals(userId)) {
      throw new IllegalArgumentException("只能取消自己的订单");
    }

    orderRepository.delete(order);
    log.info("meal_order_cancelled id={}", orderId);
  }
}
