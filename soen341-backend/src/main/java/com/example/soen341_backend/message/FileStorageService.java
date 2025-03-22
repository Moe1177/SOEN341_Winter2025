package com.example.soen341_backend.message;

import java.io.IOException;
import java.io.InputStream;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.stream.Stream;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.util.FileSystemUtils;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

/** Implementation of StorageService that uses the local filesystem */
@Slf4j
@Service
public class FileStorageService implements StorageService {

  private final Path rootLocation;
  private final AttachmentRepository attachmentRepository;

  public FileStorageService(
      @Value("${file.upload-dir:uploads}") String uploadDir,
      AttachmentRepository attachmentRepository) {
    this.attachmentRepository = attachmentRepository;
    this.rootLocation = Paths.get(uploadDir);

    log.info("File storage location: {}", this.rootLocation);

    try {
      Files.createDirectories(this.rootLocation);
      log.info("Successfully created upload directory at: {}", this.rootLocation);
    } catch (IOException ex) {
      log.error("Failed to create upload directory at: {}", this.rootLocation, ex);
      throw new RuntimeException(
          "Could not create the directory where the uploaded files will be stored.", ex);
    }
  }

  @Override
  public void init() {
    try {
      Files.createDirectories(rootLocation);
    } catch (IOException e) {
      throw new StorageException("Could not initialize storage", e);
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

      try (InputStream inputStream = file.getInputStream()) {
        Files.copy(
            inputStream,
            this.rootLocation.resolve(uniqueFilename),
            StandardCopyOption.REPLACE_EXISTING);
        return uniqueFilename;
      }
    } catch (IOException e) {
      throw new StorageException("Failed to store file", e);
    }
  }

  @Override
  public Stream<Path> loadAll() {
    try {
      return Files.walk(this.rootLocation, 1)
          .filter(path -> !path.equals(this.rootLocation))
          .map(this.rootLocation::relativize);
    } catch (IOException e) {
      throw new StorageException("Failed to read stored files", e);
    }
  }

  @Override
  public Path load(String filename) {
    return rootLocation.resolve(filename);
  }

  @Override
  public Resource loadAsResource(String filename) {
    try {
      Path file = load(filename);
      Resource resource = new UrlResource(file.toUri());
      if (resource.exists() || resource.isReadable()) {
        return resource;
      } else {
        throw new StorageException("Could not read file: " + filename);
      }
    } catch (MalformedURLException e) {
      throw new StorageException("Could not read file: " + filename, e);
    }
  }

  @Override
  public void delete(String filename) {
    try {
      Path file = load(filename);
      Files.deleteIfExists(file);
    } catch (IOException e) {
      throw new StorageException("Could not delete file: " + filename, e);
    }
  }

  @Override
  public void deleteAll() {
    FileSystemUtils.deleteRecursively(rootLocation.toFile());
  }

  /**
   * Stores a file and creates an Attachment entity
   *
   * @param file The file to store
   * @param messageId The ID of the message this attachment belongs to
   * @return The created Attachment entity
   */
  @Override
  public Attachment storeFile(MultipartFile file, String messageId) {
    try {
      // Normalize and clean the file name
      String originalFileName = StringUtils.cleanPath(file.getOriginalFilename());
      log.info("Processing file upload: {} for message: {}", originalFileName, messageId);

      // Check if the file name contains invalid characters
      if (originalFileName.contains("..")) {
        log.error("Invalid file name detected: {}", originalFileName);
        throw new RuntimeException("Filename contains invalid path sequence: " + originalFileName);
      }

      // Generate a unique file name to prevent name collisions
      String uniqueFileName = System.currentTimeMillis() + "_" + originalFileName;
      log.info("Generated unique file name: {}", uniqueFileName);

      // Copy the file to the target location
      Path targetLocation = this.rootLocation.resolve(uniqueFileName);
      log.info("Copying file to: {}", targetLocation);

      try (InputStream inputStream = file.getInputStream()) {
        Files.copy(inputStream, targetLocation, StandardCopyOption.REPLACE_EXISTING);
      }
      log.info("Successfully copied file to: {}", targetLocation);

      // Create and save the attachment entity
      Attachment attachment =
          Attachment.builder()
              .originalFileName(originalFileName)
              .fileName(uniqueFileName)
              .fileUrl("/api/messages/attachments/" + uniqueFileName)
              .contentType(file.getContentType())
              .size(file.getSize())
              .messageId(messageId)
              .isS3Storage(false)
              .build();

      Attachment savedAttachment = attachmentRepository.save(attachment);
      log.info("Successfully saved attachment entity: {}", savedAttachment);

      return savedAttachment;
    } catch (IOException ex) {
      log.error("Failed to store file: {}", file.getOriginalFilename(), ex);
      throw new RuntimeException("Could not store file. Please try again.", ex);
    }
  }
}
