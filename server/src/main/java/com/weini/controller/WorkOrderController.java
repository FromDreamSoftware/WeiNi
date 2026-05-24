package com.weini.controller;

import com.weini.dto.CreateWorkOrderRequest;
import com.weini.dto.WorkOrderResponse;
import com.weini.security.UserPrincipal;
import com.weini.service.WorkOrderService;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/work-orders")
public class WorkOrderController {

  private static final Logger log = LoggerFactory.getLogger(WorkOrderController.class);

  private final WorkOrderService workOrderService;

  public WorkOrderController(WorkOrderService workOrderService) {
    this.workOrderService = workOrderService;
  }

  @PostMapping
  public ResponseEntity<WorkOrderResponse> create(
      @AuthenticationPrincipal UserPrincipal principal,
      @Valid @RequestBody CreateWorkOrderRequest request) {
    return ResponseEntity.status(HttpStatus.CREATED)
        .body(workOrderService.create(principal.id(), request));
  }

  @GetMapping
  public ResponseEntity<Page<WorkOrderResponse>> list(
      @AuthenticationPrincipal UserPrincipal principal,
      @RequestParam(required = false) String view,
      @RequestParam(required = false) String period,
      @PageableDefault(size = 12, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
    return ResponseEntity.ok(workOrderService.list(principal.id(), principal.role(), view, period, pageable));
  }

  @PatchMapping("/{id}")
  public ResponseEntity<WorkOrderResponse> handle(
      @PathVariable Long id,
      @RequestParam String status,
      @RequestParam(required = false) String handlerNote,
      @AuthenticationPrincipal UserPrincipal principal) {
    return ResponseEntity.ok(workOrderService.handle(id, status, handlerNote, principal.id()));
  }
}
