package com.weini.repository;

import com.weini.entity.Photo;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PhotoRepository extends JpaRepository<Photo, Long> {

  List<Photo> findByAlbumIdOrderByCreatedAtDesc(Long albumId);

  long countByAlbumId(Long albumId);
}
