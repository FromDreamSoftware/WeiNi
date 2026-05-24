package com.weini.repository;

import com.weini.entity.Notification;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;

public interface NotificationRepository extends JpaRepository<Notification, Long> {

  List<Notification> findByUserIdAndIsReadFalseOrderByCreatedAtDesc(Long userId);

  List<Notification> findByUserIdOrderByCreatedAtDesc(Long userId);

  Page<Notification> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);

  List<Notification> findByUserIdAndCreatedAtAfterOrderByCreatedAtDesc(Long userId, LocalDateTime since);

  Page<Notification> findByUserIdAndCreatedAtAfterOrderByCreatedAtDesc(Long userId, LocalDateTime since, Pageable pageable);

  long countByUserIdAndIsReadFalse(Long userId);
}
