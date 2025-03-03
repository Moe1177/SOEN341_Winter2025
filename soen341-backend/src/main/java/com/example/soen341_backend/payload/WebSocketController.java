package com.example.soen341_backend.payload;

import com.example.soen341_backend.message.Message;
import com.example.soen341_backend.message.MessageService;
import com.example.soen341_backend.security.JwtUtils;
import com.example.soen341_backend.user.User;
import com.example.soen341_backend.user.UserService;
import java.time.Instant;
import java.util.Map;
import lombok.AllArgsConstructor;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

@Controller
@AllArgsConstructor
public class WebSocketController {
  private final SimpMessagingTemplate messagingTemplate;
  private final MessageService messageService;
  private final UserService userService;
  private final JwtUtils jwtUtils;

  @MessageMapping("/channel/{channelId}")
  public void handleChannelMessage(
      @DestinationVariable String channelId,
      @Payload WebSocketMessage webSocketMessage,
      SimpMessageHeaderAccessor headerAccessor) {

    // Extract user ID from the authentication token
    String senderId = getUsernameFromHeaders(headerAccessor);

    // Create and save message to database
    Message message = new Message();
    message.setContent(webSocketMessage.getContent());
    message.setSenderId(senderId); // Use the extracted senderId
    message.setChannelId(channelId);
    message.setTimestamp(Instant.now());
    message.setDirectMessage(false);

    Message savedMessage = messageService.sendChannelMessage(message, senderId);

    // Add sender name to the response
    User sender = userService.getUserById(senderId);
    webSocketMessage.setSenderId(senderId); // Ensure the correct sender ID is set
    webSocketMessage.setSenderUserName(sender.getUsername());
    webSocketMessage.setTimestamp(Instant.now());

    // Broadcast message to all subscribers of this channel
    messagingTemplate.convertAndSend("/topic/channel/" + channelId, webSocketMessage);
  }

  /** Handle direct messages between users */
  @MessageMapping("/dm/{recipientId}")
  public void handleDirectMessage(
      @DestinationVariable String recipientId,
      @Payload WebSocketMessage webSocketMessage,
      SimpMessageHeaderAccessor headerAccessor) {

    // Extract user ID from the authentication token
    String senderId = getUsernameFromHeaders(headerAccessor);

    // Create and save direct message
    Message message = new Message();
    message.setContent(webSocketMessage.getContent());
    message.setSenderId(senderId); // Use the extracted senderId
    message.setReceiverId(recipientId);
    message.setDirectMessage(true);

    Message savedMessage = messageService.sendDirectMessage(message, senderId, recipientId);

    // Add channel ID and sender name to the response
    webSocketMessage.setSenderId(senderId); // Ensure the correct sender ID is set
    webSocketMessage.setChannelId(savedMessage.getChannelId());
    User sender = userService.getUserById(senderId);
    webSocketMessage.setSenderUserName(sender.getUsername());
    webSocketMessage.setTimestamp(Instant.now());

    // Send message to sender
    messagingTemplate.convertAndSend("/queue/user/" + senderId, webSocketMessage);

    // Send message to recipient
    messagingTemplate.convertAndSend("/queue/user/" + recipientId, webSocketMessage);
  }

  // Helper method to extract user ID from WebSocket headers
  private String getUsernameFromHeaders(SimpMessageHeaderAccessor headerAccessor) {
    Map<String, Object> sessionAttributes = headerAccessor.getSessionAttributes();
    if (sessionAttributes != null && sessionAttributes.containsKey("username")) {
      return (String) sessionAttributes.get("username");
    }

    // If username not found in session attributes, try to extract from authorization header
    String authHeader = headerAccessor.getFirstNativeHeader("Authorization");
    if (authHeader != null && authHeader.startsWith("Bearer ")) {
      String token = authHeader.substring(7);
      return jwtUtils.extractUsername(token);
    }

    throw new IllegalStateException("User not authenticated");
  }
}
