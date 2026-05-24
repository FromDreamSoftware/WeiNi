package com.weini.controller;

import com.weini.dto.MoodCheckinRequest;
import com.weini.dto.MoodResponse;
import com.weini.dto.MoodStatsResponse;
import com.weini.security.UserPrincipal;
import com.weini.service.MoodService;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/moods")
public class MoodController {

  private static final Logger log = LoggerFactory.getLogger(MoodController.class);

  private final MoodService moodService;

  public MoodController(MoodService moodService) {
    this.moodService = moodService;
  }

  @GetMapping
  public ResponseEntity<List<MoodResponse>> calendar(
      @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate start,
      @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate end,
      @RequestParam(required = false) Long userId) {
    return ResponseEntity.ok(moodService.getCalendar(start, end, userId));
  }

  @GetMapping("/today")
  public ResponseEntity<MoodResponse> getToday(@AuthenticationPrincipal UserPrincipal principal) {
    MoodResponse result = moodService.getToday(principal.id());
    return result != null ? ResponseEntity.ok(result) : ResponseEntity.noContent().build();
  }

  @GetMapping("/stats")
  public ResponseEntity<MoodStatsResponse> getStats(@AuthenticationPrincipal UserPrincipal principal) {
    return ResponseEntity.ok(moodService.getStats(principal.id()));
  }

  @PostMapping
  public ResponseEntity<MoodResponse> checkin(
      @AuthenticationPrincipal UserPrincipal principal,
      @Valid @RequestBody MoodCheckinRequest request) {
    return ResponseEntity.status(HttpStatus.CREATED).body(moodService.checkin(principal.id(), request));
  }

  @PutMapping("/today")
  public ResponseEntity<MoodResponse> updateToday(
      @AuthenticationPrincipal UserPrincipal principal,
      @Valid @RequestBody MoodCheckinRequest request) {
    return ResponseEntity.ok(moodService.updateToday(principal.id(), request));
  }

  @PutMapping("/{id}")
  public ResponseEntity<MoodResponse> update(
      @AuthenticationPrincipal UserPrincipal principal,
      @PathVariable Long id,
      @Valid @RequestBody MoodCheckinRequest request) {
    return ResponseEntity.ok(moodService.update(principal.id(), id, request));
  }

  @DeleteMapping("/today")
  public ResponseEntity<Void> deleteToday(@AuthenticationPrincipal UserPrincipal principal) {
    moodService.deleteToday(principal.id());
    return ResponseEntity.noContent().build();
  }

  @DeleteMapping("/{id}")
  public ResponseEntity<Void> delete(
      @AuthenticationPrincipal UserPrincipal principal,
      @PathVariable Long id) {
    moodService.delete(principal.id(), id);
    return ResponseEntity.noContent().build();
  }
}
