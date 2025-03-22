package com.example.soen341_backend.message;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/** Factory to get the appropriate storage service based on configuration */
@Component
public class StorageServiceFactory {

  private final FileStorageService fileStorageService;
  private final S3StorageService s3StorageService;
  private final boolean s3Enabled;

  public StorageServiceFactory(
      FileStorageService fileStorageService,
      S3StorageService s3StorageService,
      @Value("${aws.s3.enabled:false}") boolean s3Enabled) {
    this.fileStorageService = fileStorageService;
    this.s3StorageService = s3StorageService;
    this.s3Enabled = s3Enabled;
  }

  /**
   * Get the appropriate storage service based on configuration
   *
   * @return the storage service
   */
  public StorageService getStorageService() {
    return s3Enabled ? s3StorageService : fileStorageService;
  }

  /**
   * Get the storage service based on whether the file is stored in S3
   *
   * @param isS3Storage true if the file is stored in S3
   * @return the storage service
   */
  public StorageService getStorageService(boolean isS3Storage) {
    return isS3Storage ? s3StorageService : fileStorageService;
  }
}
