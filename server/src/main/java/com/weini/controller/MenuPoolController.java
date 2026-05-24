package com.weini.controller;

import com.weini.dto.CreateMenuItemRequest;
import com.weini.dto.MenuItemResponse;
import com.weini.service.MenuPoolService;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/menu-pool")
public class MenuPoolController {

  private static final Logger log = LoggerFactory.getLogger(MenuPoolController.class);

  private final MenuPoolService menuPoolService;

  public MenuPoolController(MenuPoolService menuPoolService) {
    this.menuPoolService = menuPoolService;
  }

  @GetMapping
  public ResponseEntity<List<MenuItemResponse>> list(
      @RequestParam(required = false) Boolean activeOnly) {
    return ResponseEntity.ok(menuPoolService.list(activeOnly));
  }

  @PostMapping
  public ResponseEntity<MenuItemResponse> create(@Valid @RequestBody CreateMenuItemRequest request) {
    return ResponseEntity.status(HttpStatus.CREATED).body(menuPoolService.create(request));
  }

  @DeleteMapping("/{id}")
  public ResponseEntity<Void> delete(@PathVariable Long id) {
    menuPoolService.delete(id);
    return ResponseEntity.noContent().build();
  }

  @PutMapping(value = "/{id}/image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
  public ResponseEntity<MenuItemResponse> uploadImage(
      @PathVariable Long id,
      @RequestParam("file") MultipartFile file) {
    return ResponseEntity.ok(menuPoolService.updateImage(id, file));
  }
}
