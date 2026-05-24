package com.weini.service;

import com.weini.dto.*;
import com.weini.entity.*;
import com.weini.repository.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@Service
@Transactional(readOnly = true)
public class CookingRecordService {

  private static final Logger log = LoggerFactory.getLogger(CookingRecordService.class);

  private final CookingRecordRepository recordRepository;
  private final CookingRatingRepository ratingRepository;
  private final MealOrderRepository mealOrderRepository;
  private final UserRepository userRepository;
  private final MinioStorageService minioStorage;
  private final NotificationService notificationService;

  public CookingRecordService(CookingRecordRepository recordRepository,
                               CookingRatingRepository ratingRepository,
                               MealOrderRepository mealOrderRepository,
                               UserRepository userRepository,
                               MinioStorageService minioStorage,
                               NotificationService notificationService) {
    this.recordRepository = recordRepository;
    this.ratingRepository = ratingRepository;
    this.mealOrderRepository = mealOrderRepository;
    this.userRepository = userRepository;
    this.minioStorage = minioStorage;
    this.notificationService = notificationService;
  }

  public List<CookingRecordResponse> list() {
    List<CookingRecord> records = recordRepository.findAllByOrderByCookingDateDescCreatedAtDesc();
    return records.stream()
        .map(r -> {
          List<RatingResponse> ratings = ratingRepository.findByCookingRecordIdOrderByCreatedAtAsc(r.getId())
              .stream().map(RatingResponse::from).toList();
          return CookingRecordResponse.from(r, minioStorage.getPresignedUrl(r.getPhotoUrl()), ratings);
        })
        .toList();
  }

  @Transactional
  public CookingRecordResponse create(Long chefId, CreateCookingRecordRequest req, MultipartFile photo) {
    User chef = userRepository.findById(chefId)
        .orElseThrow(() -> new IllegalArgumentException("用户不存在"));

    CookingRecord record = new CookingRecord();
    record.setChef(chef);
    record.setCookingDate(req.cookingDate());
    record.setNote(req.dishName());

    if (req.mealOrderId() != null) {
      mealOrderRepository.findById(req.mealOrderId()).ifPresent(record::setMealOrder);
    }

    if (photo != null && !photo.isEmpty()) {
      record.setPhotoUrl(minioStorage.upload(photo, "cooking"));
    }

    record = recordRepository.save(record);
    log.info("cooking_record_created id={} chefId={}", record.getId(), chefId);
    return CookingRecordResponse.from(record, minioStorage.getPresignedUrl(record.getPhotoUrl()), List.of());
  }

  @Transactional
  public void delete(Long id) {
    CookingRecord record = recordRepository.findById(id)
        .orElseThrow(() -> new IllegalArgumentException("记录不存在"));
    if (record.getPhotoUrl() != null) {
      minioStorage.delete(record.getPhotoUrl());
    }
    recordRepository.delete(record);
    log.info("cooking_record_deleted id={}", id);
  }

  @Transactional
  public RatingResponse rate(Long recordId, Long raterId, CreateRatingRequest req) {
    CookingRecord record = recordRepository.findById(recordId)
        .orElseThrow(() -> new IllegalArgumentException("记录不存在"));

    User rater = userRepository.findById(raterId)
        .orElseThrow(() -> new IllegalArgumentException("用户不存在"));

    ratingRepository.findByCookingRecordIdAndRaterId(recordId, raterId)
        .ifPresent(r -> { throw new IllegalArgumentException("你已经评价过了"); });

    CookingRating rating = new CookingRating();
    rating.setCookingRecord(record);
    rating.setRater(rater);
    rating.setRating(req.rating());
    rating.setComment(req.comment());
    rating = ratingRepository.save(rating);

    log.info("cooking_rated recordId={} raterId={} rating={}", recordId, raterId, req.rating());

    notificationService.create(record.getChef().getId(), NotificationType.COOKING_RATING,
        "新评分",
        rater.getNickname() + "给你的「" + record.getNote() + "」评了" + req.rating() + "星",
        record.getId(), "cooking_record");

    return RatingResponse.from(rating);
  }
}
