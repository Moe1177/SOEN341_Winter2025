package com.example.soen341_backend.message;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

@Slf4j
@Service
public class FileStorageService {

  private final Path fileStorageLocation;
  private final AttachmentRepository attachmentRepository;

  public FileStorageService(
      @Value("${file.upload-dir:uploads}") String uploadDir,
      AttachmentRepository attachmentRepository) {
    this.attachmentRepository = attachmentRepository;
    this.fileStorageLocation = Paths.get(uploadDir).toAbsolutePath().normalize();

    log.info("File storage location: {}", this.fileStorageLocation);

    try {
      Files.createDirectories(this.fileStorageLocation);
      log.info("Successfully created upload directory at: {}", this.fileStorageLocation);
    } catch (IOException ex) {
      log.error("Failed to create upload directory at: {}", this.fileStorageLocation, ex);
      throw new RuntimeException(
          "Could not create the directory where the uploaded files will be stored.", ex);
    }
  }

  /**
   * Stores a file and creates an Attachment entity
   *
   * @param file The file to store
   * @param messageId The ID of the message this attachment belongs to
   * @return The created Attachment entity
   */
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
      String uniqueFileName = UUID.randomUUID().toString() + "_" + originalFileName;
      log.info("Generated unique file name: {}", uniqueFileName);

      // Copy the file to the target location
      Path targetLocation = this.fileStorageLocation.resolve(uniqueFileName);
      log.info("Copying file to: {}", targetLocation);

      Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);
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
              .build();

      Attachment savedAttachment = attachmentRepository.save(attachment);
      log.info("Successfully saved attachment entity: {}", savedAttachment);

      return savedAttachment;
    } catch (IOException ex) {
      log.error("Failed to store file: {}", file.getOriginalFilename(), ex);
      throw new RuntimeException("Could not store file. Please try again.", ex);
    }
  }

  /**
   * Loads a file as a Resource
   *
   * @param fileName The name of the file to load
   * @return The file as a Resource
   */
  public Resource loadFileAsResource(String fileName) {
    try {
      Path filePath = this.fileStorageLocation.resolve(fileName).normalize();
      Resource resource = new UrlResource(filePath.toUri());

      if (resource.exists()) {
        return resource;
      } else {
        throw new RuntimeException("File not found: " + fileName);
      }
    } catch (Exception ex) {
      throw new RuntimeException("File not found: " + fileName, ex);
    }
  }

  /**
   * Deletes a file from the file system
   *
   * @param fileName The name of the file to delete
   */
  public void deleteFile(String fileName) {
    try {
      Path filePath = this.fileStorageLocation.resolve(fileName).normalize();
      Files.deleteIfExists(filePath);
    } catch (IOException ex) {
      throw new RuntimeException("Could not delete file: " + fileName, ex);
    }
  }
}
