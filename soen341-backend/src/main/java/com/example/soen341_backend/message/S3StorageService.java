package com.example.soen341_backend.message;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.stream.Stream;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.*;

/** Implementation of StorageService that uses AWS S3 */
@Service
public class S3StorageService implements StorageService {

  private final String bucketName;
  private final S3Client s3Client;

  public S3StorageService(
      @Value("${aws.s3.bucket-name}") String bucketName, @Value("${aws.s3.region}") String region) {
    this.bucketName = bucketName;
    this.s3Client = S3Client.builder().region(Region.of(region)).build();
  }

  @Override
  public void init() {
    try {
      // Check if bucket exists, if not create it
      HeadBucketRequest headBucketRequest = HeadBucketRequest.builder().bucket(bucketName).build();

      try {
        s3Client.headBucket(headBucketRequest);
      } catch (NoSuchBucketException e) {
        CreateBucketRequest createBucketRequest =
            CreateBucketRequest.builder().bucket(bucketName).build();
        s3Client.createBucket(createBucketRequest);
      }
    } catch (Exception e) {
      throw new StorageException("Could not initialize S3 storage", e);
    }
  }

  @Override
  public String store(MultipartFile file) {
    try {
      if (file.isEmpty()) {
        throw new StorageException("Failed to store empty file");
      }

      String filename = StringUtils.cleanPath(file.getOriginalFilename());
      if (filename.contains("..")) {
        throw new StorageException(
            "Cannot store file with relative path outside current directory: " + filename);
      }

      // Generate a unique filename to avoid collisions
      String uniqueFilename = System.currentTimeMillis() + "_" + filename;

      // Upload file to S3
      PutObjectRequest putObjectRequest =
          PutObjectRequest.builder()
              .bucket(bucketName)
              .key(uniqueFilename)
              .contentType(file.getContentType())
              .build();

      s3Client.putObject(
          putObjectRequest, RequestBody.fromInputStream(file.getInputStream(), file.getSize()));

      return uniqueFilename;
    } catch (IOException e) {
      throw new StorageException("Failed to store file", e);
    }
  }

  @Override
  public Stream<Path> loadAll() {
    try {
      ListObjectsV2Request listObjectsRequest =
          ListObjectsV2Request.builder().bucket(bucketName).build();

      ListObjectsV2Response listObjectsResponse = s3Client.listObjectsV2(listObjectsRequest);

      return listObjectsResponse.contents().stream().map(s3Object -> Paths.get(s3Object.key()));
    } catch (Exception e) {
      throw new StorageException("Failed to load all files", e);
    }
  }

  @Override
  public Path load(String filename) {
    return Paths.get(filename);
  }

  @Override
  public Resource loadAsResource(String filename) {
    try {
      GetUrlRequest getUrlRequest =
          GetUrlRequest.builder().bucket(bucketName).key(filename).build();

      java.net.URL url = s3Client.utilities().getUrl(getUrlRequest);

      return new UrlResource(url);
    } catch (MalformedURLException e) {
      throw new StorageException("Could not read file: " + filename, e);
    }
  }

  @Override
  public void delete(String filename) {
    try {
      DeleteObjectRequest deleteObjectRequest =
          DeleteObjectRequest.builder().bucket(bucketName).key(filename).build();

      s3Client.deleteObject(deleteObjectRequest);
    } catch (Exception e) {
      throw new StorageException("Could not delete file: " + filename, e);
    }
  }

  @Override
  public void deleteAll() {
    try {
      ListObjectsV2Request listObjectsRequest =
          ListObjectsV2Request.builder().bucket(bucketName).build();

      ListObjectsV2Response listObjectsResponse = s3Client.listObjectsV2(listObjectsRequest);

      for (S3Object s3Object : listObjectsResponse.contents()) {
        delete(s3Object.key());
      }
    } catch (Exception e) {
      throw new StorageException("Could not delete all files", e);
    }
  }
}
