package com.example.soen341_backend.message;

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

  @GetMapping("/{id}")
  public Message getMessageById(@PathVariable String id) {
    return messageService.getMessageById(id);
  }

  @GetMapping("/channel/{channelId}")
  public List<Message> getChannelMessages(
      @PathVariable String channelId, @RequestParam String userId) {
    return messageService.getChannelMessages(channelId, userId);
  }

  @GetMapping("/dm")
  public List<Message> getDirectMessages(
      @RequestParam String userId, @RequestParam String otherUserId) {
    return messageService.getDirectMessages(userId, otherUserId);
  }

  @PostMapping("/channel")
  public Message sendChannelMessage(@RequestBody Message message, @RequestParam String userId) {
    return messageService.sendChannelMessage(message, userId);
  }

  @PostMapping("/dm")
  public Message sendDirectMessage(
      @RequestBody Message message,
      @RequestParam String senderId,
      @RequestParam String recipientId) {
    return messageService.sendDirectMessage(message, senderId, recipientId);
  }

  @DeleteMapping("/{id}")
  public ResponseEntity<?> deleteMessage(@PathVariable String id, @RequestParam String userId) {
    messageService.deleteMessage(id, userId);
    return ResponseEntity.ok().build();
  }
}
