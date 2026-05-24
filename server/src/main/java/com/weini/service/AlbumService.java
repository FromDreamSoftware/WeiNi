package com.weini.service;

import com.weini.dto.AlbumResponse;
import com.weini.dto.CreateAlbumRequest;
import com.weini.entity.PhotoAlbum;
import com.weini.repository.AlbumRepository;
import com.weini.repository.PhotoRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional(readOnly = true)
public class AlbumService {

  private static final Logger log = LoggerFactory.getLogger(AlbumService.class);

  private final AlbumRepository albumRepository;
  private final PhotoRepository photoRepository;
  private final MinioStorageService minioStorage;

  public AlbumService(AlbumRepository albumRepository, PhotoRepository photoRepository, MinioStorageService minioStorage) {
    this.albumRepository = albumRepository;
    this.photoRepository = photoRepository;
    this.minioStorage = minioStorage;
  }

  public List<AlbumResponse> list() {
    List<PhotoAlbum> albums = albumRepository.findAllByOrderByCreatedAtDesc();
    return albums.stream()
        .map(a -> AlbumResponse.from(a,
            minioStorage.getPresignedUrl(a.getCoverImageUrl()),
            photoRepository.countByAlbumId(a.getId())))
        .toList();
  }

  @Transactional
  public AlbumResponse create(CreateAlbumRequest req) {
    PhotoAlbum album = new PhotoAlbum();
    album.setTitle(req.title());
    album = albumRepository.save(album);
    log.info("album_created id={} title={}", album.getId(), album.getTitle());
    return AlbumResponse.from(album, null, 0);
  }

  @Transactional
  public void delete(Long id) {
    albumRepository.deleteById(id);
    log.info("album_deleted id={}", id);
  }
}
