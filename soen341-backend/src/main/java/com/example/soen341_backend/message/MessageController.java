package com.example.soen341_backend.message;

import com.example.soen341_backend.security.JwtUtils;
import jakarta.servlet.http.HttpServletRequest;
import java.util.List;
import lombok.AllArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping(value = "/api/messages", produces = MediaType.APPLICATION_JSON_VALUE)
@AllArgsConstructor
@CrossOrigin
public class MessageController {

  private final MessageService messageService;
  private final JwtUtils jwtUtils;

  @GetMapping("/{id}")
  public Message getMessageById(@PathVariable String id) {
    return messageService.getMessageById(id);
  }

  @GetMapping("/channel/{channelId}")
  public List<Message> getChannelMessages(
      @PathVariable String channelId, HttpServletRequest request) {
    // Extract userId from JWT token
    String username = getUserIdFromRequest(request);
    return messageService.getChannelMessages(channelId, username);
  }

  @GetMapping("/direct-messages")
  public List<Message> getDirectMessages(
      @RequestParam String otherUserId, HttpServletRequest request) {
    // Extract userId from JWT token
    String username = getUserIdFromRequest(request);
    return messageService.getDirectMessages(username, otherUserId);
  }

  @PostMapping("/channel")
  public Message sendChannelMessage(@RequestBody Message message, HttpServletRequest request) {
    // Extract userId from JWT token
    String username = getUserIdFromRequest(request);
    return messageService.sendChannelMessage(message, username);
  }

  @PostMapping("/dm")
  public Message sendDirectMessage(
      @RequestBody Message message, @RequestParam String recipientId, HttpServletRequest request) {
    // Extract senderId from JWT token
    String senderUsername = getUserIdFromRequest(request);
    return messageService.sendDirectMessage(message, senderUsername, recipientId);
  }

  @DeleteMapping("/{id}")
  public ResponseEntity<?> deleteMessage(@PathVariable String id, HttpServletRequest request) {
    // Extract userId from JWT token
    String username = getUserIdFromRequest(request);
    messageService.deleteMessage(id, username);
    return ResponseEntity.ok().build();
  }

  @PostMapping("/{id}")
  public ResponseEntity<?> editMessage(
      @PathVariable String id, Message newMessage, HttpServletRequest request) {
    // Extract userId from JWT token
    String username = getUserIdFromRequest(request);
    messageService.editMessage(id, username, newMessage);
    return ResponseEntity.ok().build();
  }

  // Helper method to extract the username from JWT token in the request
  private String getUserIdFromRequest(HttpServletRequest request) {
    String bearerToken = request.getHeader("Authorization");
    if (bearerToken != null && bearerToken.startsWith("Bearer ")) {
      String token = bearerToken.substring(7);
      return jwtUtils.extractUsername(token);
    }
    throw new IllegalStateException("No JWT token found in request");
  }
}
