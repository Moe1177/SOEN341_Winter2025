package com.example.soen341_backend.message;

import com.example.soen341_backend.exceptions.ResourceNotFoundException;
import com.mongodb.client.gridfs.GridFSBucket;
import com.mongodb.client.gridfs.model.GridFSFile;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.Arrays;
import java.util.HashSet;
import java.util.Set;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.io.IOUtils;
import org.bson.types.ObjectId;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.gridfs.GridFsResource;
import org.springframework.data.mongodb.gridfs.GridFsTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
@AllArgsConstructor
@Slf4j
public class FileService {

  private final GridFsTemplate gridFsTemplate;
  private final GridFSBucket gridFSBucket;

  // Common file extensions we'll accept
  private static final Set<String> ALLOWED_CONTENT_TYPES = new HashSet<>(Arrays.asList(
      // Images
      "image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml", 
      // Documents
      "application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-powerpoint", "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      // Text files
      "text/plain", "text/html", "text/css", "text/javascript",
      // Archives
      "application/zip", "application/x-rar-compressed"
  ));

  // Maximum file size (10MB)
  private static final long MAX_FILE_SIZE = 10 * 1024 * 1024;

  /**
   * Validates a file for storage.
   *
   * @param file the file to validate
   * @throws IllegalArgumentException if the file doesn't meet the requirements
   */
  private void validateFile(MultipartFile file) {
    if (file == null || file.isEmpty()) {
      throw new IllegalArgumentException("File cannot be empty");
    }

    if (file.getSize() > MAX_FILE_SIZE) {
      throw new IllegalArgumentException("File size exceeds the maximum allowed (10MB)");
    }

    String contentType = file.getContentType();
    if (contentType == null || !ALLOWED_CONTENT_TYPES.contains(contentType.toLowerCase())) {
      log.warn("Attempted to upload file with unsupported content type: {}", contentType);
      throw new IllegalArgumentException("File type not supported");
    }
  }

  /**
   * Stores a file in GridFS.
   *
   * @param file the file to store
   * @return the ID of the stored file
   * @throws IOException if there's an error reading the file
   * @throws IllegalArgumentException if the file doesn't meet the requirements
   */
  public String storeFile(MultipartFile file) throws IOException {
    log.info("Storing file: {}, size: {}, type: {}", 
             file.getOriginalFilename(), file.getSize(), file.getContentType());
    
    validateFile(file);
    
    try (InputStream inputStream = file.getInputStream()) {
      ObjectId fileId = gridFsTemplate.store(
          inputStream,
          file.getOriginalFilename(),
          file.getContentType());
          
      log.info("Successfully stored file with ID: {}", fileId.toString());
      return fileId.toString();
    } catch (Exception e) {
      log.error("Error storing file in GridFS", e);
      throw new IOException("Failed to store file: " + e.getMessage(), e);
    }
  }

  /**
   * Retrieves a file by its ID.
   *
   * @param fileId the ID of the file to retrieve
   * @return a GridFsResource representing the file
   * @throws ResourceNotFoundException if the file is not found
   */
  public GridFsResource getFile(String fileId) {
    log.info("Retrieving file with ID: {}", fileId);
    
    try {
      ObjectId objectId = new ObjectId(fileId);
      GridFSFile file = gridFsTemplate.findOne(new Query(Criteria.where("_id").is(objectId)));
      
      if (file == null) {
        log.warn("File not found with ID: {}", fileId);
        throw new ResourceNotFoundException("File not found with id: " + fileId);
      }
      
      return new GridFsResource(file, gridFSBucket.openDownloadStream(file.getObjectId()));
    } catch (IllegalArgumentException e) {
      log.error("Invalid file ID format: {}", fileId, e);
      throw new ResourceNotFoundException("Invalid file ID format: " + fileId);
    }
  }

  /**
   * Gets file data as byte array.
   *
   * @param fileId the ID of the file
   * @return byte array containing the file data
   * @throws IOException if there's an error reading the file
   */
  public byte[] getFileData(String fileId) throws IOException {
    GridFsResource resource = getFile(fileId);
    
    try (InputStream inputStream = resource.getInputStream();
         ByteArrayOutputStream outputStream = new ByteArrayOutputStream()) {
      
      IOUtils.copy(inputStream, outputStream);
      byte[] data = outputStream.toByteArray();
      log.info("Successfully retrieved file data for ID: {}, size: {} bytes", fileId, data.length);
      
      return data;
    } catch (IOException e) {
      log.error("Error reading file data for ID: {}", fileId, e);
      throw new IOException("Failed to read file data: " + e.getMessage(), e);
    }
  }

  /**
   * Deletes a file from GridFS.
   *
   * @param fileId the ID of the file to delete
   */
  public void deleteFile(String fileId) {
    log.info("Deleting file with ID: {}", fileId);
    
    try {
      ObjectId objectId = new ObjectId(fileId);
      gridFsTemplate.delete(new Query(Criteria.where("_id").is(objectId)));
      log.info("Successfully deleted file with ID: {}", fileId);
    } catch (Exception e) {
      log.error("Error deleting file with ID: {}", fileId, e);
      // We don't throw an exception here to avoid breaking message deletion if file deletion fails
    }
  }
} 