package com.weini.service;

import com.weini.dto.SnackResponse;
import com.weini.entity.Snack;
import com.weini.entity.SnackStatus;
import com.weini.repository.SnackRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@Service
@Transactional(readOnly = true)
public class SnackService {

  private static final Logger log = LoggerFactory.getLogger(SnackService.class);

  private final SnackRepository snackRepository;
  private final MinioStorageService minioStorageService;

  public SnackService(SnackRepository snackRepository, MinioStorageService minioStorageService) {
    this.snackRepository = snackRepository;
    this.minioStorageService = minioStorageService;
  }

  public List<SnackResponse> list(String category, String status, String search) {
    List<Snack> all = snackRepository.findAll(Sort.by(Sort.Direction.DESC, "createdAt"));
    return all.stream()
        .filter(s -> category == null || s.getCategory().equals(category))
        .filter(s -> status == null || s.getStatus() == SnackStatus.valueOf(status.toUpperCase()))
        .filter(s -> search == null || search.isBlank() || s.getName().toLowerCase().contains(search.toLowerCase()))
        .map(s -> SnackResponse.from(s, minioStorageService.getPresignedUrl(s.getImageUrl())))
        .toList();
  }

  public SnackResponse getRandom() {
    return snackRepository.findRandomAvailable()
        .map(s -> SnackResponse.from(s, minioStorageService.getPresignedUrl(s.getImageUrl())))
        .orElseThrow(() -> new IllegalArgumentException("库存空空，快去补货吧~"));
  }

  @Transactional
  public SnackResponse relist(Long id) {
    Snack snack = snackRepository.findById(id)
        .orElseThrow(() -> new IllegalArgumentException("零食不存在"));
    snack.setStatus(SnackStatus.AVAILABLE);
    snackRepository.save(snack);
    log.info("snack_relisted id={}", id);
    return SnackResponse.from(snack, minioStorageService.getPresignedUrl(snack.getImageUrl()));
  }

  @Transactional
  public SnackResponse consume(Long id, int count) {
    Snack snack = snackRepository.findById(id)
        .orElseThrow(() -> new IllegalArgumentException("零食不存在"));
    int newStock = Math.max(0, snack.getStock() - count);
    snack.setStock(newStock);
    if (newStock == 0) {
      snack.setStatus(SnackStatus.UNAVAILABLE);
    }
    snackRepository.save(snack);
    log.info("snack_consumed id={} consumed={} remaining={}", id, count, newStock);
    return SnackResponse.from(snack, minioStorageService.getPresignedUrl(snack.getImageUrl()));
  }

  @Transactional
  public SnackResponse updateImage(Long id, MultipartFile file) {
    Snack snack = snackRepository.findById(id)
        .orElseThrow(() -> new IllegalArgumentException("零食不存在"));

    if (snack.getImageUrl() != null) {
      minioStorageService.delete(snack.getImageUrl());
    }

    String objectName = minioStorageService.upload(file, "snack-images");
    snack.setImageUrl(objectName);
    snackRepository.save(snack);
    log.info("snack_image_updated id={} object={}", id, objectName);
    return SnackResponse.from(snack, minioStorageService.getPresignedUrl(objectName));
  }
}
