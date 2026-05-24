package com.weini.repository;

import com.weini.entity.SnackRequest;
import com.weini.entity.SnackRequestStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;

public interface SnackRequestRepository extends JpaRepository<SnackRequest, Long> {

  List<SnackRequest> findByRequesterIdOrderByCreatedAtDesc(Long requesterId);

  List<SnackRequest> findByStatusOrderByCreatedAtDesc(SnackRequestStatus status);

  List<SnackRequest> findByRequesterIdAndStatusOrderByCreatedAtDesc(Long requesterId, SnackRequestStatus status);

  List<SnackRequest> findByStatusInOrderByCreatedAtDesc(List<SnackRequestStatus> statuses);

  Page<SnackRequest> findByStatusInOrderByCreatedAtDesc(List<SnackRequestStatus> statuses, Pageable pageable);

  List<SnackRequest> findByHandlerIdAndCreatedAtAfterOrderByCreatedAtDesc(Long handlerId, LocalDateTime since);

  List<SnackRequest> findByRequesterIdAndCreatedAtAfterOrderByCreatedAtDesc(Long requesterId, LocalDateTime since);

  Page<SnackRequest> findByHandlerIdOrderByCreatedAtDesc(Long handlerId, Pageable pageable);

  Page<SnackRequest> findByRequesterIdOrderByCreatedAtDesc(Long requesterId, Pageable pageable);
}
