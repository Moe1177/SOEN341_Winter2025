package com.example.soen341_backend.message;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.Transient;
import org.springframework.data.mongodb.core.mapping.Document;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
@Document(collection = "messages")
public class Message {

  @Id private String id;

  private String content;
  private String senderId;
  private String senderUsername;
  private String channelId;
  private Instant timestamp;
  private boolean isDirectMessage;
  private String receiverId;

  @Transient private List<Attachment> attachments = new ArrayList<>();
}
