package com.example.soen341_backend.message;

import com.example.soen341_backend.security.JwtUtils;
import jakarta.servlet.http.HttpServletRequest;
import java.util.List;
import lombok.AllArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

@Controller
@RequestMapping("/api/messages")
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
    String userId = getUserIdFromRequest(request);
    return messageService.getChannelMessages(channelId, userId);
  }

  @GetMapping("/dm")
  public List<Message> getDirectMessages(
      @RequestParam String otherUserId, HttpServletRequest request) {
    // Extract userId from JWT token
    String userId = getUserIdFromRequest(request);
    return messageService.getDirectMessages(userId, otherUserId);
  }

  @PostMapping("/channel")
  public Message sendChannelMessage(@RequestBody Message message, HttpServletRequest request) {
    // Extract userId from JWT token
    String userId = getUserIdFromRequest(request);
    return messageService.sendChannelMessage(message, userId);
  }

  @PostMapping("/dm")
  public Message sendDirectMessage(
      @RequestBody Message message, @RequestParam String recipientId, HttpServletRequest request) {
    // Extract senderId from JWT token
    String senderId = getUserIdFromRequest(request);
    return messageService.sendDirectMessage(message, senderId, recipientId);
  }

  @DeleteMapping("/{id}")
  public ResponseEntity<?> deleteMessage(@PathVariable String id, HttpServletRequest request) {
    // Extract userId from JWT token
    String userId = getUserIdFromRequest(request);
    messageService.deleteMessage(id, userId);
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
