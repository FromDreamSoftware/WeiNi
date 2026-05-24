package com.weini.controller;

import com.weini.dto.CommentResponse;
import com.weini.dto.CreateCommentRequest;
import com.weini.dto.PhotoResponse;
import com.weini.security.UserPrincipal;
import com.weini.service.PhotoService;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api")
public class PhotoController {

  private static final Logger log = LoggerFactory.getLogger(PhotoController.class);

  private final PhotoService photoService;

  public PhotoController(PhotoService photoService) {
    this.photoService = photoService;
  }

  @PostMapping("/albums/{albumId}/photos")
  public ResponseEntity<PhotoResponse> upload(
      @PathVariable Long albumId,
      @RequestParam MultipartFile file,
      @RequestParam(required = false) String caption,
      @RequestParam(required = false) String tags,
      @AuthenticationPrincipal UserPrincipal principal) {
    return ResponseEntity.status(HttpStatus.CREATED)
        .body(photoService.upload(albumId, file, caption, tags, principal.id()));
  }

  @GetMapping("/albums/{albumId}/photos")
  public ResponseEntity<List<PhotoResponse>> listByAlbum(@PathVariable Long albumId) {
    return ResponseEntity.ok(photoService.listByAlbum(albumId));
  }

  @DeleteMapping("/photos/{id}")
  public ResponseEntity<Void> delete(@PathVariable Long id,
      @AuthenticationPrincipal UserPrincipal principal) {
    photoService.delete(id, principal.id());
    return ResponseEntity.noContent().build();
  }

  @PostMapping("/photos/{id}/comments")
  public ResponseEntity<CommentResponse> addComment(
      @PathVariable Long id,
      @Valid @RequestBody CreateCommentRequest request,
      @AuthenticationPrincipal UserPrincipal principal) {
    return ResponseEntity.status(HttpStatus.CREATED)
        .body(photoService.addComment(id, request, principal.id()));
  }
}
