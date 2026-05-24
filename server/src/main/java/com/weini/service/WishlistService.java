package com.weini.service;

import com.weini.dto.CreateWishlistRequest;
import com.weini.dto.UpdateWishlistRequest;
import com.weini.dto.WishlistResponse;
import com.weini.entity.*;
import com.weini.repository.UserRepository;
import com.weini.repository.WishlistRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.LocalDateTime;

@Service
@Transactional(readOnly = true)
public class WishlistService {

  private static final Logger log = LoggerFactory.getLogger(WishlistService.class);

  private final WishlistRepository wishlistRepository;
  private final UserRepository userRepository;
  private final MinioStorageService minioStorage;

  public WishlistService(WishlistRepository wishlistRepository, UserRepository userRepository, MinioStorageService minioStorage) {
    this.wishlistRepository = wishlistRepository;
    this.userRepository = userRepository;
    this.minioStorage = minioStorage;
  }

  public Page<WishlistResponse> list(String category, String status, Pageable pageable) {
    WishlistCategory cat = category != null ? WishlistCategory.valueOf(category) : null;
    WishlistStatus st = status != null ? WishlistStatus.valueOf(status) : null;
    return wishlistRepository.findByFilters(st, cat, pageable)
        .map(item -> WishlistResponse.from(item,
            minioStorage.getPresignedUrl(item.getImageUrl()),
            minioStorage.getPresignedUrl(item.getAchievedPhoto())));
  }

  @Transactional
  public WishlistResponse create(Long userId, CreateWishlistRequest req, MultipartFile image) {
    User user = userRepository.findById(userId)
        .orElseThrow(() -> new IllegalArgumentException("用户不存在"));

    WishlistItem item = new WishlistItem();
    item.setTitle(req.title());
    item.setDescription(req.description());
    item.setCategory(req.category() != null ? WishlistCategory.valueOf(req.category().name()) : WishlistCategory.OTHER);
    item.setCreatedBy(user);

    if (image != null && !image.isEmpty()) {
      item.setImageUrl(minioStorage.upload(image, "wishlist"));
    }

    item = wishlistRepository.save(item);
    log.info("wishlist_created id={} title={}", item.getId(), item.getTitle());
    return WishlistResponse.from(item,
        minioStorage.getPresignedUrl(item.getImageUrl()),
        minioStorage.getPresignedUrl(item.getAchievedPhoto()));
  }

  @Transactional
  public WishlistResponse update(Long wishId, Long userId, UpdateWishlistRequest req, MultipartFile image) {
    WishlistItem item = wishlistRepository.findById(wishId)
        .orElseThrow(() -> new IllegalArgumentException("愿望不存在"));
    if (!item.getCreatedBy().getId().equals(userId)) {
      throw new IllegalArgumentException("只能修改自己创建的愿望");
    }

    if (req.title() != null) item.setTitle(req.title());
    if (req.description() != null) item.setDescription(req.description());
    if (req.category() != null) item.setCategory(WishlistCategory.valueOf(req.category().name()));

    if (image != null && !image.isEmpty()) {
      if (item.getImageUrl() != null) minioStorage.delete(item.getImageUrl());
      item.setImageUrl(minioStorage.upload(image, "wishlist"));
    }

    item = wishlistRepository.save(item);
    log.info("wishlist_updated id={}", item.getId());
    return WishlistResponse.from(item,
        minioStorage.getPresignedUrl(item.getImageUrl()),
        minioStorage.getPresignedUrl(item.getAchievedPhoto()));
  }

  @Transactional
  public void delete(Long id, Long userId) {
    WishlistItem item = wishlistRepository.findById(id)
        .orElseThrow(() -> new IllegalArgumentException("愿望不存在"));
    if (!item.getCreatedBy().getId().equals(userId)) {
      throw new IllegalArgumentException("只能删除自己创建的愿望");
    }
    if (item.getImageUrl() != null) {
      minioStorage.delete(item.getImageUrl());
    }
    if (item.getAchievedPhoto() != null) {
      minioStorage.delete(item.getAchievedPhoto());
    }
    wishlistRepository.delete(item);
    log.info("wishlist_deleted id={}", id);
  }

  @Transactional
  public WishlistResponse achieve(Long id, Long userId, MultipartFile photo) {
    WishlistItem item = wishlistRepository.findById(id)
        .orElseThrow(() -> new IllegalArgumentException("愿望不存在"));
    if (item.getStatus() == WishlistStatus.ACHIEVED) {
      throw new IllegalArgumentException("该愿望已达成");
    }

    String photoName = null;
    if (photo != null && !photo.isEmpty()) {
      photoName = minioStorage.upload(photo, "wishlist");
    }

    User achiever = userRepository.findById(userId)
        .orElseThrow(() -> new IllegalArgumentException("用户不存在"));

    item.setStatus(WishlistStatus.ACHIEVED);
    item.setAchievedBy(achiever);
    item.setAchievedAt(LocalDateTime.now());
    if (photoName != null) {
      item.setAchievedPhoto(photoName);
    }

    item = wishlistRepository.save(item);
    log.info("wishlist_achieved id={} title={}", item.getId(), item.getTitle());
    return WishlistResponse.from(item,
        minioStorage.getPresignedUrl(item.getImageUrl()),
        minioStorage.getPresignedUrl(item.getAchievedPhoto()));
  }
}
