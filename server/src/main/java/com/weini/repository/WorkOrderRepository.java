package com.weini.repository;

import com.weini.entity.WorkOrder;
import com.weini.entity.WorkOrderStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;

public interface WorkOrderRepository extends JpaRepository<WorkOrder, Long> {

  List<WorkOrder> findByCreatorIdOrderByCreatedAtDesc(Long creatorId);

  List<WorkOrder> findAllByOrderByCreatedAtDesc();

  List<WorkOrder> findByStatusOrderByCreatedAtDesc(WorkOrderStatus status);

  List<WorkOrder> findByHandlerIdAndCreatedAtAfterOrderByCreatedAtDesc(Long handlerId, LocalDateTime since);

  List<WorkOrder> findByCreatorIdAndCreatedAtAfterOrderByCreatedAtDesc(Long creatorId, LocalDateTime since);

  Page<WorkOrder> findByHandlerIdAndCreatedAtAfterOrderByCreatedAtDesc(Long handlerId, LocalDateTime since, Pageable pageable);

  Page<WorkOrder> findByCreatorIdAndCreatedAtAfterOrderByCreatedAtDesc(Long creatorId, LocalDateTime since, Pageable pageable);

  Page<WorkOrder> findByCreatorIdOrderByCreatedAtDesc(Long creatorId, Pageable pageable);
}
