package com.weini.controller;

import com.weini.dto.AnniversaryResponse;
import com.weini.dto.CreateAnniversaryRequest;
import com.weini.entity.AnniversaryType;
import com.weini.service.AnniversaryService;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/anniversaries")
@Validated
public class AnniversaryController {

  private static final Logger log = LoggerFactory.getLogger(AnniversaryController.class);

  private final AnniversaryService anniversaryService;

  public AnniversaryController(AnniversaryService anniversaryService) {
    this.anniversaryService = anniversaryService;
  }

  @GetMapping
  public ResponseEntity<List<AnniversaryResponse>> list() {
    return ResponseEntity.ok(anniversaryService.findAll());
  }

  @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
  public ResponseEntity<AnniversaryResponse> create(
      @RequestPart("title") @NotBlank String title,
      @RequestPart("eventDate") @NotNull String eventDateStr,
      @RequestPart("type") @NotNull String typeStr,
      @RequestPart(value = "customType", required = false) String customType,
      @RequestPart(value = "icon", required = false) String icon,
      @RequestPart(value = "image", required = false) MultipartFile image) {

    LocalDate eventDate = LocalDate.parse(eventDateStr);
    AnniversaryType type = AnniversaryType.valueOf(typeStr);

    CreateAnniversaryRequest request = new CreateAnniversaryRequest(
        title, eventDate, type,
        (customType != null && !customType.isBlank()) ? customType.trim() : null,
        (icon != null && !icon.isBlank()) ? icon.trim() : "💕"
    );

    return ResponseEntity.status(HttpStatus.CREATED).body(anniversaryService.create(request, image));
  }

  @DeleteMapping("/{id}")
  public ResponseEntity<Void> delete(@PathVariable Long id) {
    anniversaryService.deleteById(id);
    return ResponseEntity.noContent().build();
  }
}
