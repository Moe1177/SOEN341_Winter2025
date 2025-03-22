package com.example.soen341_backend.message;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

/** Document representing a message attachment */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "attachments")
public class Attachment {

  @Id private String id;

  private String fileName;
  private String originalFileName;
  private String fileUrl;
  private String contentType;
  private long size;
  private String messageId;

  // Flag to indicate if the attachment is stored in S3 or local file system
  private boolean isS3Storage;
}
