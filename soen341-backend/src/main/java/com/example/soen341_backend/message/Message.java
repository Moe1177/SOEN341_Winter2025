package com.example.soen341_backend.message;

import java.time.Instant;
import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
@Document(collection = "messages")
public class Message {

  @Id private String id;

  private String senderId;
  private String channelId;
  private String receiverId;
  private String username;
  private String content;
  private Instant timestamp;

  private boolean edited;
  private Instant editedAt;
  private boolean deleted;
  private MessageType type;
}
