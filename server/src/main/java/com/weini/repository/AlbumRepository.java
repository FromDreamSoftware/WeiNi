package com.weini.repository;

import com.weini.entity.PhotoAlbum;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AlbumRepository extends JpaRepository<PhotoAlbum, Long> {

  List<PhotoAlbum> findAllByOrderByCreatedAtDesc();
}
