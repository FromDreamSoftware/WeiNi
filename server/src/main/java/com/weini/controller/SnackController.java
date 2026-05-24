package com.weini.controller;

import com.weini.dto.ConsumeSnackRequest;
import com.weini.dto.SnackResponse;
import com.weini.service.SnackService;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/snacks")
public class SnackController {

  private static final Logger log = LoggerFactory.getLogger(SnackController.class);

  private final SnackService snackService;

  public SnackController(SnackService snackService) {
    this.snackService = snackService;
  }

  @GetMapping
  public ResponseEntity<List<SnackResponse>> list(
      @RequestParam(required = false) String category,
      @RequestParam(required = false) String status,
      @RequestParam(required = false) String search) {
    return ResponseEntity.ok(snackService.list(category, status, search));
  }

  @GetMapping("/random")
  public ResponseEntity<SnackResponse> random() {
    return ResponseEntity.ok(snackService.getRandom());
  }

  @PatchMapping("/{id}/relist")
  public ResponseEntity<SnackResponse> relist(@PathVariable Long id) {
    return ResponseEntity.ok(snackService.relist(id));
  }

  @PutMapping("/{id}/image")
  public ResponseEntity<SnackResponse> updateImage(
      @PathVariable Long id,
      @RequestParam("file") MultipartFile file) {
    return ResponseEntity.ok(snackService.updateImage(id, file));
  }

  @PostMapping("/{id}/consume")
  public ResponseEntity<SnackResponse> consume(
      @PathVariable Long id,
      @Valid @RequestBody ConsumeSnackRequest request) {
    return ResponseEntity.ok(snackService.consume(id, request.count()));
  }
}
