package com.weini.repository;

import com.weini.entity.PhotoComment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PhotoCommentRepository extends JpaRepository<PhotoComment, Long> {

  List<PhotoComment> findByPhotoIdOrderByCreatedAtAsc(Long photoId);

  void deleteByPhotoId(Long photoId);
}
