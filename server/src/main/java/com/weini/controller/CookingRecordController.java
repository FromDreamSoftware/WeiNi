package com.weini.controller;

import com.weini.dto.CookingRecordResponse;
import com.weini.dto.CreateCookingRecordRequest;
import com.weini.dto.CreateRatingRequest;
import com.weini.dto.RatingResponse;
import com.weini.security.UserPrincipal;
import com.weini.service.CookingRecordService;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/cooking-records")
public class CookingRecordController {

  private static final Logger log = LoggerFactory.getLogger(CookingRecordController.class);

  private final CookingRecordService cookingRecordService;

  public CookingRecordController(CookingRecordService cookingRecordService) {
    this.cookingRecordService = cookingRecordService;
  }

  @GetMapping
  public ResponseEntity<List<CookingRecordResponse>> list() {
    return ResponseEntity.ok(cookingRecordService.list());
  }

  @PostMapping
  public ResponseEntity<CookingRecordResponse> create(
      @AuthenticationPrincipal UserPrincipal principal,
      @RequestParam String dishName,
      @RequestParam String cookingDate,
      @RequestParam(required = false) Long mealOrderId,
      @RequestParam(required = false) MultipartFile photo) {
    CreateCookingRecordRequest req = new CreateCookingRecordRequest(
        LocalDate.parse(cookingDate), dishName, dishName, mealOrderId);
    return ResponseEntity.status(HttpStatus.CREATED).body(cookingRecordService.create(principal.id(), req, photo));
  }

  @DeleteMapping("/{id}")
  public ResponseEntity<Void> delete(@PathVariable Long id) {
    cookingRecordService.delete(id);
    return ResponseEntity.noContent().build();
  }

  @PostMapping("/{id}/ratings")
  public ResponseEntity<RatingResponse> rate(
      @PathVariable Long id,
      @Valid @RequestBody CreateRatingRequest request,
      @AuthenticationPrincipal UserPrincipal principal) {
    return ResponseEntity.status(HttpStatus.CREATED)
        .body(cookingRecordService.rate(id, principal.id(), request));
  }
}
