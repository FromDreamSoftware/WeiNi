package com.weini.controller;

import com.weini.security.UserPrincipal;
import com.weini.service.NotificationService;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

  private final NotificationService notificationService;

  public NotificationController(NotificationService notificationService) {
    this.notificationService = notificationService;
  }

  @GetMapping
  public ResponseEntity<?> list(@AuthenticationPrincipal UserPrincipal principal,
                                 Pageable pageable,
                                 @RequestParam(required = false) Integer days) {
    return ResponseEntity.ok(notificationService.getByUser(principal.id(), pageable, days));
  }

  @GetMapping("/unread-count")
  public ResponseEntity<Map<String, Long>> unreadCount(@AuthenticationPrincipal UserPrincipal principal) {
    return ResponseEntity.ok(Map.of("count", notificationService.getUnreadCount(principal.id())));
  }

  @PatchMapping("/{id}/read")
  public ResponseEntity<Void> markRead(@PathVariable Long id, @AuthenticationPrincipal UserPrincipal principal) {
    notificationService.markRead(id, principal.id());
    return ResponseEntity.ok().build();
  }

  @PatchMapping("/read-all")
  public ResponseEntity<Void> markAllRead(@AuthenticationPrincipal UserPrincipal principal) {
    notificationService.markAllRead(principal.id());
    return ResponseEntity.ok().build();
  }

  @PatchMapping("/unread-all")
  public ResponseEntity<Map<String, Integer>> markAllUnread(
      @AuthenticationPrincipal UserPrincipal principal,
      @RequestParam(required = false) Integer days) {
    int count = notificationService.markAllUnread(principal.id(), days);
    return ResponseEntity.ok(Map.of("count", count));
  }
}
