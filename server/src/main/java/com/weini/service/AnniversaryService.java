package com.weini.service;

import com.weini.dto.AnniversaryResponse;
import com.weini.dto.CreateAnniversaryRequest;
import com.weini.entity.Anniversary;
import com.weini.repository.AnniversaryRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@Service
@Transactional(readOnly = true)
public class AnniversaryService {

  private static final Logger log = LoggerFactory.getLogger(AnniversaryService.class);

  private final AnniversaryRepository anniversaryRepository;
  private final MinioStorageService minioStorageService;

  public AnniversaryService(AnniversaryRepository anniversaryRepository,
                            MinioStorageService minioStorageService) {
    this.anniversaryRepository = anniversaryRepository;
    this.minioStorageService = minioStorageService;
  }

  public List<AnniversaryResponse> findAll() {
    return anniversaryRepository.findAllByOrderByEventDateAsc().stream()
        .map(a -> AnniversaryResponse.from(a, minioStorageService.getPresignedUrl(a.getImageUrl())))
        .toList();
  }

  @Transactional
  public AnniversaryResponse create(CreateAnniversaryRequest request, MultipartFile image) {
    String objectName = null;
    if (image != null && !image.isEmpty()) {
      objectName = minioStorageService.upload(image, "anniversaries");
    }

    Anniversary a = new Anniversary(
        request.title(), request.eventDate(), request.type(),
        request.icon() != null ? request.icon() : "💕",
        request.customType(), objectName);
    Anniversary saved = anniversaryRepository.save(a);
    log.info("anniversary_created title={} date={}", saved.getTitle(), saved.getEventDate());
    return AnniversaryResponse.from(saved, minioStorageService.getPresignedUrl(saved.getImageUrl()));
  }

  @Transactional
  public void deleteById(Long id) {
    Anniversary a = anniversaryRepository.findById(id)
        .orElseThrow(() -> new IllegalArgumentException("纪念日不存在"));
    if (a.getImageUrl() != null) {
      minioStorageService.delete(a.getImageUrl());
    }
    anniversaryRepository.delete(a);
    log.info("anniversary_deleted id={}", id);
  }
}
