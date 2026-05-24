package com.weini.controller;

import com.weini.dto.AlbumResponse;
import com.weini.dto.CreateAlbumRequest;
import com.weini.service.AlbumService;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/albums")
public class AlbumController {

  private static final Logger log = LoggerFactory.getLogger(AlbumController.class);

  private final AlbumService albumService;

  public AlbumController(AlbumService albumService) {
    this.albumService = albumService;
  }

  @GetMapping
  public ResponseEntity<List<AlbumResponse>> list() {
    return ResponseEntity.ok(albumService.list());
  }

  @PostMapping
  public ResponseEntity<AlbumResponse> create(@Valid @RequestBody CreateAlbumRequest request) {
    return ResponseEntity.status(HttpStatus.CREATED).body(albumService.create(request));
  }

  @DeleteMapping("/{id}")
  public ResponseEntity<Void> delete(@PathVariable Long id) {
    albumService.delete(id);
    return ResponseEntity.noContent().build();
  }
}
