package com.example.soen341_backend.payload;

import com.example.soen341_backend.message.Message;
import java.time.Instant;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
public class WebSocketMessage {
  private String content;
  private String senderId;
  private String senderUsername;
  private String channelId;
  private String receiverId;
  private boolean isDirectMessage;
  private Instant timestamp;
  private boolean hasAttachment;
  private List<Message.FileInfo> attachments;
}
