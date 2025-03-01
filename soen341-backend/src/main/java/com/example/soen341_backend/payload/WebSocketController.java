package com.example.soen341_backend.payload;

import com.example.soen341_backend.message.Message;
import com.example.soen341_backend.message.MessageService;
import com.example.soen341_backend.user.User;
import com.example.soen341_backend.user.UserService;
import java.time.Instant;
import lombok.AllArgsConstructor;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

@Controller
@AllArgsConstructor
public class WebSocketController {
  private final SimpMessagingTemplate messagingTemplate;
  private final MessageService messageService;
  private final UserService userService;

  /** Handle messages sent to channels */
  @MessageMapping("/channel/{channelId}")
  public void handleChannelMessage(
      @DestinationVariable String channelId, @Payload WebSocketMessage webSocketMessage) {

    // Create and save message to database
    Message message = new Message();
    message.setContent(webSocketMessage.getContent());
    message.setSenderId(webSocketMessage.getSenderId());
    message.setChannelId(channelId);
    message.setTimestamp(Instant.now());
    message.setDirectMessage(false);

    Message savedMessage =
        messageService.sendChannelMessage(message, webSocketMessage.getSenderId());

    // Add sender name to the response
    User sender = userService.getUserById(webSocketMessage.getSenderId());
    webSocketMessage.setSenderUserName(sender.getUsername());
    webSocketMessage.setTimestamp(Instant.now());

    // Broadcast message to all subscribers of this channel
    messagingTemplate.convertAndSend("/topic/channel/" + channelId, webSocketMessage);
  }

  /** Handle direct messages between users */
  @MessageMapping("/dm/{senderId}/{recipientId}")
  public void handleDirectMessage(
      @DestinationVariable String senderId,
      @DestinationVariable String recipientId,
      @Payload WebSocketMessage webSocketMessage) {

    // Create and save direct message
    Message message = new Message();
    message.setContent(webSocketMessage.getContent());
    message.setSenderId(senderId);
    message.setReceiverId(recipientId);
    message.setDirectMessage(true);

    Message savedMessage = messageService.sendDirectMessage(message, senderId, recipientId);

    // Add channel ID and sender name to the response
    webSocketMessage.setChannelId(savedMessage.getChannelId());
    User sender = userService.getUserById(senderId);
    webSocketMessage.setSenderUserName(sender.getUsername());
    webSocketMessage.setTimestamp(Instant.now());

    // Send message to sender
    messagingTemplate.convertAndSend("/queue/user/" + senderId, webSocketMessage);

    // Send message to recipient
    messagingTemplate.convertAndSend("/queue/user/" + recipientId, webSocketMessage);
  }
}
