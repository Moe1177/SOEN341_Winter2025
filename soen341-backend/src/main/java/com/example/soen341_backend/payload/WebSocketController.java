package com.example.soen341_backend.payload;

import com.example.soen341_backend.exceptions.ResourceNotFoundException;
import com.example.soen341_backend.message.Message;
import com.example.soen341_backend.message.MessageService;
import com.example.soen341_backend.security.JwtUtils;
import com.example.soen341_backend.user.User;
import com.example.soen341_backend.user.UserRepository;
import com.example.soen341_backend.user.UserService;
import java.time.Instant;
import java.util.Map;
import lombok.AllArgsConstructor;
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
  private final UserRepository userRepository;

  // app/group-message
  @MessageMapping({"/group-message"})
  public void handleChannelMessage(
      @Payload WebSocketMessage webSocketMessage, SimpMessageHeaderAccessor headerAccessor) {
    /**
     * Handles incoming WebSocket messages for group channels.
     *
     * @param webSocketMessage the incoming message payload containing content, sender, and channel
     *     details (type: {@link WebSocketMessage}).
     * @param headerAccessor provides access to WebSocket session headers for extracting
     *     authentication details (type: {@link SimpMessageHeaderAccessor}).
     *     <p>Processes the message by extracting the sender's username, retrieving the user from
     *     the database, saving the message, and broadcasting it to all subscribers of the specified
     *     channel.
     * @return void (no explicit return, message is sent via WebSocket).
     */
    System.out.println("Received Channel message: " + webSocketMessage.getContent());
    System.out.println("Sending message to: /channel/" + webSocketMessage.getChannelId());

    // Extract user ID from the authentication token
    String senderUsername = getUsernameFromHeaders(headerAccessor);

    User findUser =
        userRepository
            .findByUsername(senderUsername)
            .orElseThrow(
                () ->
                    new ResourceNotFoundException(
                        "No user exists with this username: " + senderUsername));

    // Create and save message to database
    Message message = new Message();
    message.setContent(webSocketMessage.getContent());
    message.setSenderId(findUser.getId());
    message.setSenderUsername(senderUsername);
    message.setChannelId(webSocketMessage.getChannelId());
    message.setTimestamp(Instant.now());
    message.setDirectMessage(false);

    messageService.sendChannelMessage(message, findUser.getId());

    // Add sender name to the response
    webSocketMessage.setSenderId(findUser.getId());
    webSocketMessage.setSenderUsername(senderUsername);
    webSocketMessage.setTimestamp(Instant.now());
    webSocketMessage.setDirectMessage(false);
    webSocketMessage.setReceiverId(webSocketMessage.getReceiverId());
    webSocketMessage.setChannelId(webSocketMessage.getChannelId());

    String destination = "/topic/channel/" + webSocketMessage.getChannelId();
    // Broadcast message to all subscribers of this channel
    messagingTemplate.convertAndSend(destination, webSocketMessage);
  }

  // app/direct-message
  @MessageMapping({"/direct-message"})
  public void handleDirectMessage(
      @Payload WebSocketMessage webSocketMessage, SimpMessageHeaderAccessor headerAccessor) {
    /**
     * Handles incoming WebSocket messages for direct messaging between users.
     *
     * @param webSocketMessage the incoming message payload containing content, sender, receiver,
     *     and metadata (type: {@link WebSocketMessage}).
     * @param headerAccessor provides access to WebSocket session headers for extracting
     *     authentication details (type: {@link SimpMessageHeaderAccessor}).
     *     <p>Extracts the sender's username, retrieves the sender from the database, creates and
     *     saves the direct message, and sends it to the intended recipient via WebSocket.
     * @return void (no explicit return, message is sent via WebSocket).
     */
    System.out.println("Received Direct message: " + webSocketMessage);

    // Extract user ID from the authentication token
    String senderUsername = getUsernameFromHeaders(headerAccessor);

    User findUser =
        userRepository
            .findByUsername(senderUsername)
            .orElseThrow(() -> new ResourceNotFoundException("No user exists with this username"));

    // Create and save direct message
    Message message = new Message();
    message.setContent(webSocketMessage.getContent());
    message.setSenderId(findUser.getId()); // Use the extracted senderId
    message.setChannelId(webSocketMessage.getChannelId());
    message.setTimestamp(Instant.now());
    message.setDirectMessage(webSocketMessage.isDirectMessage());
    message.setReceiverId(webSocketMessage.getReceiverId());

    Message savedMessage =
        messageService.sendDirectMessage(message, senderUsername, webSocketMessage.getReceiverId());

    // Add channel ID and sender name to the response
    webSocketMessage.setSenderId(findUser.getId()); // Ensure the correct sender ID is set
    webSocketMessage.setChannelId(savedMessage.getChannelId());
    webSocketMessage.setSenderUsername(senderUsername);
    webSocketMessage.setTimestamp(Instant.now());

    //    // Send message to sender
    //    messagingTemplate.convertAndSendToUser(webSocketMessage.getSenderId(),"/queue" + senderId,
    // webSocketMessage);

    // Send message to recipient
    messagingTemplate.convertAndSendToUser(
        webSocketMessage.getReceiverId(),
        "/direct-messages",
        webSocketMessage); // /user/{recipientId}/queue
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
