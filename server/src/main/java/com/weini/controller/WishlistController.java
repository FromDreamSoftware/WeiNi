package com.weini.controller;

import com.weini.dto.CreateWishlistRequest;
import com.weini.dto.UpdateWishlistRequest;
import com.weini.dto.WishlistResponse;
import com.weini.security.UserPrincipal;
import com.weini.service.WishlistService;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/wishlist")
public class WishlistController {

  private static final Logger log = LoggerFactory.getLogger(WishlistController.class);

  private final WishlistService wishlistService;

  public WishlistController(WishlistService wishlistService) {
    this.wishlistService = wishlistService;
  }

  @GetMapping
  public ResponseEntity<Page<WishlistResponse>> list(
      @RequestParam(required = false) String category,
      @RequestParam(required = false) String status,
      @PageableDefault(size = 12) Pageable pageable) {
    return ResponseEntity.ok(wishlistService.list(category, status, pageable));
  }

  @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
  public ResponseEntity<WishlistResponse> create(
      @AuthenticationPrincipal UserPrincipal principal,
      @Valid @RequestPart("request") CreateWishlistRequest request,
      @RequestPart(value = "image", required = false) MultipartFile image) {
    return ResponseEntity.status(HttpStatus.CREATED)
        .body(wishlistService.create(principal.id(), request, image));
  }

  @PutMapping(value = "/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
  public ResponseEntity<WishlistResponse> update(
      @AuthenticationPrincipal UserPrincipal principal,
      @PathVariable Long id,
      @Valid @RequestPart("request") UpdateWishlistRequest request,
      @RequestPart(value = "image", required = false) MultipartFile image) {
    return ResponseEntity.ok(wishlistService.update(id, principal.id(), request, image));
  }

  @DeleteMapping("/{id}")
  public ResponseEntity<Void> delete(
      @AuthenticationPrincipal UserPrincipal principal,
      @PathVariable Long id) {
    wishlistService.delete(id, principal.id());
    return ResponseEntity.noContent().build();
  }

  @PatchMapping("/{id}/achieve")
  public ResponseEntity<WishlistResponse> achieve(
      @AuthenticationPrincipal UserPrincipal principal,
      @PathVariable Long id,
      @RequestParam(required = false) MultipartFile photo) {
    return ResponseEntity.ok(wishlistService.achieve(id, principal.id(), photo));
  }
}
