package com.weini.dto;

import com.weini.entity.PhotoAlbum;

import java.time.LocalDateTime;

public record AlbumResponse(
    Long id,
    String title,
    String coverImageUrl,
    long photoCount,
    LocalDateTime createdAt
) {
  public static AlbumResponse from(PhotoAlbum album, String coverUrl, long photoCount) {
    return new AlbumResponse(
        album.getId(), album.getTitle(), coverUrl, photoCount, album.getCreatedAt());
  }
}
