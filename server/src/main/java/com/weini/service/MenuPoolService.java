package com.weini.service;

import com.weini.dto.CreateMenuItemRequest;
import com.weini.dto.MenuItemResponse;
import com.weini.entity.MenuItem;
import com.weini.repository.MenuRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@Service
@Transactional(readOnly = true)
public class MenuPoolService {

  private static final Logger log = LoggerFactory.getLogger(MenuPoolService.class);

  private final MenuRepository menuRepository;
  private final MinioStorageService minioStorageService;

  public MenuPoolService(MenuRepository menuRepository, MinioStorageService minioStorageService) {
    this.menuRepository = menuRepository;
    this.minioStorageService = minioStorageService;
  }

  public List<MenuItemResponse> list(Boolean activeOnly) {
    List<MenuItem> items;
    if (activeOnly != null && activeOnly) {
      items = menuRepository.findByIsActiveTrueOrderByCreatedAtDesc();
    } else {
      items = menuRepository.findAllByOrderByCreatedAtDesc();
    }
    return items.stream()
        .map(item -> {
          String presignedUrl = minioStorageService.getPresignedUrl(item.getImageUrl());
          return MenuItemResponse.from(item, presignedUrl);
        })
        .toList();
  }

  @Transactional
  public MenuItemResponse create(CreateMenuItemRequest request) {
    MenuItem item = new MenuItem();
    item.setDishName(request.dishName());
    item.setCategory(request.category());
    item.setImageUrl(request.imageUrl());
    item.setActive(true);
    item = menuRepository.save(item);
    log.info("menu_item_created id={} dishName={}", item.getId(), item.getDishName());
    return MenuItemResponse.from(item, minioStorageService.getPresignedUrl(item.getImageUrl()));
  }

  @Transactional
  public void delete(Long id) {
    MenuItem item = menuRepository.findById(id)
        .orElseThrow(() -> new IllegalArgumentException("菜品不存在"));
    item.setActive(false);
    menuRepository.save(item);
    log.info("menu_item_deleted id={} dishName={}", id, item.getDishName());
  }

  @Transactional
  public MenuItemResponse updateImage(Long id, MultipartFile file) {
    MenuItem item = menuRepository.findById(id)
        .orElseThrow(() -> new IllegalArgumentException("菜品不存在"));

    if (item.getImageUrl() != null) {
      minioStorageService.delete(item.getImageUrl());
    }

    String objectName = minioStorageService.upload(file, "menu-images");
    item.setImageUrl(objectName);
    menuRepository.save(item);
    log.info("menu_item_image_updated id={} object={}", id, objectName);
    return MenuItemResponse.from(item, minioStorageService.getPresignedUrl(objectName));
  }
}
