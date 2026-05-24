package com.weini.service;

import com.weini.dto.SnackCategoryResponse;
import com.weini.entity.SnackCategory;
import com.weini.repository.SnackCategoryRepository;
import com.weini.repository.SnackRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional(readOnly = true)
public class SnackCategoryService {

  private static final Logger log = LoggerFactory.getLogger(SnackCategoryService.class);

  private final SnackCategoryRepository categoryRepository;
  private final SnackRepository snackRepository;

  public SnackCategoryService(SnackCategoryRepository categoryRepository, SnackRepository snackRepository) {
    this.categoryRepository = categoryRepository;
    this.snackRepository = snackRepository;
  }

  public List<SnackCategoryResponse> list() {
    return categoryRepository.findAll(Sort.by(Sort.Direction.ASC, "name"))
        .stream()
        .map(SnackCategoryResponse::from)
        .toList();
  }

  @Transactional
  public SnackCategoryResponse create(String name) {
    if (categoryRepository.existsByName(name)) {
      throw new IllegalArgumentException("分类已存在");
    }
    SnackCategory category = new SnackCategory();
    category.setName(name);
    category = categoryRepository.save(category);
    log.info("snack_category_created id={} name={}", category.getId(), name);
    return SnackCategoryResponse.from(category);
  }

  @Transactional
  public void delete(Long id) {
    SnackCategory category = categoryRepository.findById(id)
        .orElseThrow(() -> new IllegalArgumentException("分类不存在"));

    long count = snackRepository.findAll()
        .stream()
        .filter(s -> category.getName().equals(s.getCategory()))
        .count();

    if (count > 0) {
      throw new IllegalArgumentException("该分类下有 " + count + " 个零食，无法删除");
    }

    categoryRepository.delete(category);
    log.info("snack_category_deleted id={} name={}", id, category.getName());
  }

  @Transactional
  public void ensureExists(String name) {
    if (name != null && !name.isBlank() && !categoryRepository.existsByName(name)) {
      SnackCategory category = new SnackCategory();
      category.setName(name.trim());
      categoryRepository.save(category);
      log.info("snack_category_auto_created name={}", name);
    }
  }
}
