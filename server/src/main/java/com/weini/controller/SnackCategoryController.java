package com.weini.controller;

import com.weini.dto.SnackCategoryResponse;
import com.weini.service.SnackCategoryService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/snack-categories")
public class SnackCategoryController {

  private final SnackCategoryService categoryService;

  public SnackCategoryController(SnackCategoryService categoryService) {
    this.categoryService = categoryService;
  }

  @GetMapping
  public ResponseEntity<List<SnackCategoryResponse>> list() {
    return ResponseEntity.ok(categoryService.list());
  }

  @PostMapping
  public ResponseEntity<SnackCategoryResponse> create(@RequestBody Map<String, String> body) {
    String name = body.get("name");
    if (name == null || name.isBlank()) {
      return ResponseEntity.badRequest().build();
    }
    return ResponseEntity.status(HttpStatus.CREATED).body(categoryService.create(name));
  }

  @DeleteMapping("/{id}")
  public ResponseEntity<Void> delete(@PathVariable Long id) {
    categoryService.delete(id);
    return ResponseEntity.noContent().build();
  }
}
