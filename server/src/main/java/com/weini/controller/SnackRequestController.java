package com.weini.controller;

import com.weini.dto.CreateSnackRequest;
import com.weini.dto.SnackRequestResponse;
import com.weini.security.UserPrincipal;
import com.weini.service.SnackRequestService;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/snack-requests")
public class SnackRequestController {

  private static final Logger log = LoggerFactory.getLogger(SnackRequestController.class);

  private final SnackRequestService snackRequestService;

  public SnackRequestController(SnackRequestService snackRequestService) {
    this.snackRequestService = snackRequestService;
  }

  @PostMapping
  public ResponseEntity<SnackRequestResponse> create(
      @AuthenticationPrincipal UserPrincipal principal,
      @Valid @RequestBody CreateSnackRequest request) {
    return ResponseEntity.status(HttpStatus.CREATED)
        .body(snackRequestService.create(principal.id(), request));
  }

  @GetMapping
  public ResponseEntity<Page<SnackRequestResponse>> list(
      @AuthenticationPrincipal UserPrincipal principal,
      @RequestParam(required = false) String view,
      Pageable pageable) {
    return ResponseEntity.ok(snackRequestService.list(principal.id(), principal.role(), view, pageable));
  }

  @PatchMapping("/{id}")
  public ResponseEntity<SnackRequestResponse> handle(
      @PathVariable Long id,
      @RequestParam String status,
      @AuthenticationPrincipal UserPrincipal principal) {
    return ResponseEntity.ok(snackRequestService.handle(id, status, principal.id()));
  }
}
