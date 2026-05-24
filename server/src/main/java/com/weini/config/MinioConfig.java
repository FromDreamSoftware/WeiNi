package com.weini.config;

import io.minio.BucketExistsArgs;
import io.minio.MakeBucketArgs;
import io.minio.MinioClient;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import jakarta.annotation.PostConstruct;

@Configuration
public class MinioConfig {

  private static final Logger log = LoggerFactory.getLogger(MinioConfig.class);

  @Value("${app.minio.endpoint}")
  private String endpoint;

  @Value("${app.minio.access-key}")
  private String accessKey;

  @Value("${app.minio.secret-key}")
  private String secretKey;

  @Value("${app.minio.bucket}")
  private String bucket;

  @Bean
  public MinioClient minioClient() {
    log.info("minio_init endpoint={}", endpoint);
    return MinioClient.builder()
        .endpoint(endpoint)
        .credentials(accessKey, secretKey)
        .build();
  }

  @PostConstruct
  void initBucket() {
    try (MinioClient client = MinioClient.builder()
        .endpoint(endpoint)
        .credentials(accessKey, secretKey)
        .build()) {
      boolean exists = client.bucketExists(BucketExistsArgs.builder().bucket(bucket).build());
      if (!exists) {
        client.makeBucket(MakeBucketArgs.builder().bucket(bucket).build());
        log.info("minio_bucket_created bucket={}", bucket);
      } else {
        log.info("minio_bucket_ok bucket={}", bucket);
      }
    } catch (Exception e) {
      log.error("minio_bucket_init_failed bucket={}", bucket, e);
    }
  }
}
