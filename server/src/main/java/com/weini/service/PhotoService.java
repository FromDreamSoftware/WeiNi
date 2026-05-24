package com.weini.service;

import com.weini.dto.CommentResponse;
import com.weini.dto.CreateCommentRequest;
import com.weini.dto.PhotoResponse;
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
public class PhotoService {

  private static final Logger log = LoggerFactory.getLogger(PhotoService.class);

  private final AlbumRepository albumRepository;
  private final PhotoRepository photoRepository;
  private final PhotoCommentRepository commentRepository;
  private final UserRepository userRepository;
  private final MinioStorageService minioStorage;

  public PhotoService(AlbumRepository albumRepository, PhotoRepository photoRepository,
                      PhotoCommentRepository commentRepository, UserRepository userRepository,
                      MinioStorageService minioStorage) {
    this.albumRepository = albumRepository;
    this.photoRepository = photoRepository;
    this.commentRepository = commentRepository;
    this.userRepository = userRepository;
    this.minioStorage = minioStorage;
  }

  @Transactional
  public PhotoResponse upload(Long albumId, MultipartFile file, String caption, String tags, Long userId) {
    PhotoAlbum album = albumRepository.findById(albumId)
        .orElseThrow(() -> new IllegalArgumentException("相册不存在"));

    User user = userRepository.findById(userId)
        .orElseThrow(() -> new IllegalArgumentException("用户不存在"));

    String objectName = minioStorage.upload(file, "photos");

    Photo photo = new Photo();
    photo.setAlbum(album);
    photo.setImageUrl(objectName);
    photo.setCaption(caption);
    photo.setTags(tags);
    photo.setUploadedBy(user);
    photo = photoRepository.save(photo);

    // Set as cover if first photo
    if (album.getCoverImageUrl() == null) {
      album.setCoverImageUrl(objectName);
      albumRepository.save(album);
    }

    String url = minioStorage.getPresignedUrl(objectName);
    log.info("photo_uploaded id={} albumId={}", photo.getId(), albumId);
    return PhotoResponse.from(photo, url, List.of());
  }

  public List<PhotoResponse> listByAlbum(Long albumId) {
    List<Photo> photos = photoRepository.findByAlbumIdOrderByCreatedAtDesc(albumId);
    return photos.stream()
        .map(p -> {
          List<CommentResponse> comments = commentRepository.findByPhotoIdOrderByCreatedAtAsc(p.getId())
              .stream().map(CommentResponse::from).toList();
          return PhotoResponse.from(p, minioStorage.getPresignedUrl(p.getImageUrl()), comments);
        })
        .toList();
  }

  @Transactional
  public void delete(Long id, Long userId) {
    Photo photo = photoRepository.findById(id)
        .orElseThrow(() -> new IllegalArgumentException("照片不存在"));
    if (!photo.getUploadedBy().getId().equals(userId)) {
      throw new IllegalArgumentException("只能删除自己上传的照片");
    }
    commentRepository.deleteByPhotoId(id);
    minioStorage.delete(photo.getImageUrl());
    photoRepository.delete(photo);
    log.info("photo_deleted id={}", id);
  }

  @Transactional
  public CommentResponse addComment(Long photoId, CreateCommentRequest req, Long userId) {
    Photo photo = photoRepository.findById(photoId)
        .orElseThrow(() -> new IllegalArgumentException("照片不存在"));

    User user = userRepository.findById(userId)
        .orElseThrow(() -> new IllegalArgumentException("用户不存在"));

    PhotoComment comment = new PhotoComment();
    comment.setPhoto(photo);
    comment.setUser(user);
    comment.setContent(req.content());
    comment = commentRepository.save(comment);

    log.info("comment_added photoId={} userId={}", photoId, userId);
    return CommentResponse.from(comment);
  }
}
