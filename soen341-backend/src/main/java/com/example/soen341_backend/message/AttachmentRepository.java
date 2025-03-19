package com.example.soen341_backend.message;

import java.util.List;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AttachmentRepository extends MongoRepository<Attachment, String> {

  /**
   * Find all attachments associated with a specific message
   *
   * @param messageId The ID of the message
   * @return List of attachments for the message
   */
  List<Attachment> findByMessageId(String messageId);

  /**
   * Delete all attachments associated with a specific message
   *
   * @param messageId The ID of the message
   */
  void deleteByMessageId(String messageId);
}
