package com.weini.controller;

import com.weini.dto.CreateMealOrderRequest;
import com.weini.dto.MealOrderResponse;
import com.weini.dto.UpdateMealOrderRequest;
import com.weini.security.UserPrincipal;
import com.weini.service.MealOrderService;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/meal-orders")
public class MealOrderController {

  private static final Logger log = LoggerFactory.getLogger(MealOrderController.class);

  private final MealOrderService mealOrderService;

  public MealOrderController(MealOrderService mealOrderService) {
    this.mealOrderService = mealOrderService;
  }

  @PostMapping
  public ResponseEntity<MealOrderResponse> create(
      @AuthenticationPrincipal UserPrincipal principal,
      @Valid @RequestBody CreateMealOrderRequest request) {
    return ResponseEntity.status(HttpStatus.CREATED)
        .body(mealOrderService.create(principal.id(), request));
  }

  @GetMapping
  public ResponseEntity<Page<MealOrderResponse>> list(
      @AuthenticationPrincipal UserPrincipal principal,
      @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
      @RequestParam(required = false) String mealType,
      @RequestParam(required = false) String status,
      @RequestParam(required = false) String view,
      Pageable pageable) {
    return ResponseEntity.ok(mealOrderService.list(principal.role(), date, mealType, status, principal.id(), view, pageable));
  }

  @PatchMapping("/{id}")
  public ResponseEntity<MealOrderResponse> updateStatus(
      @AuthenticationPrincipal UserPrincipal principal,
      @PathVariable Long id,
      @RequestParam String status) {
    return ResponseEntity.ok(mealOrderService.updateStatus(id, status, principal.id()));
  }

  @PutMapping("/{id}")
  public ResponseEntity<MealOrderResponse> update(
      @AuthenticationPrincipal UserPrincipal principal,
      @PathVariable Long id,
      @RequestBody UpdateMealOrderRequest request) {
    return ResponseEntity.ok(mealOrderService.update(id, principal.id(), request));
  }

  @DeleteMapping("/{id}")
  public ResponseEntity<Void> cancel(
      @AuthenticationPrincipal UserPrincipal principal,
      @PathVariable Long id) {
    mealOrderService.cancel(id, principal.id());
    return ResponseEntity.noContent().build();
  }
}
