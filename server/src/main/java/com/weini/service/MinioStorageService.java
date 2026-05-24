package com.weini.service;

import io.minio.*;
import io.minio.http.Method;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.UUID;
import java.util.concurrent.TimeUnit;

@Service
public class MinioStorageService {

  private static final Logger log = LoggerFactory.getLogger(MinioStorageService.class);

  private final MinioClient minioClient;
  private final String bucket;
  private final String publicBaseUrl;

  public MinioStorageService(MinioClient minioClient, @Value("${app.minio.bucket}") String bucket,
                             @Value("${app.minio.public-base-url:/files}") String publicBaseUrl) {
    this.minioClient = minioClient;
    this.bucket = bucket;
    this.publicBaseUrl = publicBaseUrl;
  }

  public String upload(MultipartFile file, String prefix) {
    try {
      String ext = getExtension(file.getOriginalFilename());
      String objectName = prefix + "/" + UUID.randomUUID() + ext;
      minioClient.putObject(PutObjectArgs.builder()
          .bucket(bucket)
          .object(objectName)
          .stream(file.getInputStream(), file.getSize(), -1)
          .contentType(file.getContentType())
          .build());
      log.info("minio_uploaded object={} size={}", objectName, file.getSize());
      return objectName;
    } catch (Exception e) {
      log.error("minio_upload_failed prefix={}", prefix, e);
      throw new RuntimeException("文件上传失败: " + e.getMessage());
    }
  }

  public void delete(String objectName) {
    try {
      minioClient.removeObject(RemoveObjectArgs.builder()
          .bucket(bucket)
          .object(objectName)
          .build());
      log.info("minio_deleted object={}", objectName);
    } catch (Exception e) {
      log.error("minio_delete_failed object={}", objectName, e);
    }
  }

  public String getPresignedUrl(String objectName) {
    if (objectName == null) return null;
    return publicBaseUrl + "/" + objectName;
  }

  private String getExtension(String filename) {
    if (filename == null || !filename.contains(".")) return "";
    return filename.substring(filename.lastIndexOf("."));
  }
}
