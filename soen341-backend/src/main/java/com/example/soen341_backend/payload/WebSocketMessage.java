package com.example.soen341_backend.payload;

import java.time.Instant;
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
  private String senderUserName;
  private String channelId;
  private String receiverId;
  private boolean isDirectMessage;
  private Instant timestamp;
}
