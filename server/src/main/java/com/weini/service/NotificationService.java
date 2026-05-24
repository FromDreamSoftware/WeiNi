package com.weini.service;

import com.weini.entity.Notification;
import com.weini.entity.NotificationType;
import com.weini.repository.NotificationRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Service
public class NotificationService {

  private static final Logger log = LoggerFactory.getLogger(NotificationService.class);

  private final NotificationRepository repo;
  private final SimpMessagingTemplate messagingTemplate;

  public NotificationService(NotificationRepository repo, SimpMessagingTemplate messagingTemplate) {
    this.repo = repo;
    this.messagingTemplate = messagingTemplate;
  }

  @Transactional
  public Notification create(Long userId, NotificationType type, String title, String message,
                             Long relatedEntityId, String relatedEntityType) {
    Notification n = new Notification();
    n.setUserId(userId);
    n.setType(type);
    n.setTitle(title);
    n.setMessage(message);
    n.setRelatedEntityId(relatedEntityId);
    n.setRelatedEntityType(relatedEntityType);
    Notification saved = repo.save(n);

    long unreadCount = repo.countByUserIdAndIsReadFalse(userId);
    messagingTemplate.convertAndSendToUser(
        userId.toString(),
        "/notifications",
        Map.of(
            "id", saved.getId(),
            "type", saved.getType().name(),
            "title", saved.getTitle(),
            "message", saved.getMessage(),
            "relatedEntityId", saved.getRelatedEntityId(),
            "relatedEntityType", saved.getRelatedEntityType(),
            "isRead", saved.isRead(),
            "createdAt", saved.getCreatedAt().toString(),
            "unreadCount", unreadCount
        )
    );
    log.debug("notification_sent userId={} type={}", userId, type);
    return saved;
  }

  public Page<Notification> getByUser(Long userId, Pageable pageable, Integer days) {
    if (days != null && days > 0) {
      LocalDateTime since = LocalDateTime.now().minusDays(days);
      return repo.findByUserIdAndCreatedAtAfterOrderByCreatedAtDesc(userId, since, pageable);
    }
    return repo.findByUserIdOrderByCreatedAtDesc(userId, pageable);
  }

  public long getUnreadCount(Long userId) {
    return repo.countByUserIdAndIsReadFalse(userId);
  }

  @Transactional
  public void markRead(Long id, Long userId) {
    Notification n = repo.findById(id)
        .orElseThrow(() -> new IllegalArgumentException("通知不存在"));
    if (!n.getUserId().equals(userId)) {
      throw new IllegalArgumentException("无权操作此通知");
    }
    n.setRead(true);
    repo.save(n);
  }

  @Transactional
  public void markAllRead(Long userId) {
    repo.findByUserIdAndIsReadFalseOrderByCreatedAtDesc(userId).forEach(n -> {
      n.setRead(true);
      repo.save(n);
    });
  }

  @Transactional
  public int markAllUnread(Long userId, Integer days) {
    List<Notification> targets;
    if (days != null && days > 0) {
      LocalDateTime since = LocalDateTime.now().minusDays(days);
      targets = repo.findByUserIdAndCreatedAtAfterOrderByCreatedAtDesc(userId, since);
    } else {
      targets = repo.findByUserIdOrderByCreatedAtDesc(userId);
    }
    int count = 0;
    for (Notification n : targets) {
      if (n.isRead()) {
        n.setRead(false);
        repo.save(n);
        count++;
      }
    }
    return count;
  }
}
