package com.example.soen341_backend.channel;

import java.util.List;
import java.util.Map;
import lombok.AllArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@AllArgsConstructor
@RequestMapping("/api/channels")
@CrossOrigin
public class ChannelController {

  private final ChannelService channelService;

  @GetMapping
  public List<Channel> getAllChannels() {
    return channelService.getAllChannels();
  }

  @GetMapping("/{id}")
  public Channel getChannelById(@PathVariable String id) {
    return channelService.getChannelById(id);
  }

  @PostMapping("/create-channel")
  public Channel createChannel(@RequestBody Channel channel, @RequestParam String userId) {
    return channelService.createChannel(channel, userId);
  }

  @PutMapping("/{id}")
  public Channel updateChannel(
      @PathVariable String id, @RequestBody Channel channelDetails, @RequestParam String userId) {
    return channelService.updateChannel(id, channelDetails, userId);
  }

  @DeleteMapping("/{id}")
  public ResponseEntity<?> deleteChannel(@PathVariable String id, @RequestParam String userId) {
    channelService.deleteChannel(id, userId);
    return ResponseEntity.ok().build();
  }

  @PostMapping("/{channelId}/users/{userId}")
  public Channel addUserToChannel(@PathVariable String channelId, @PathVariable String userId) {
    return channelService.addUserToChannel(channelId, userId);
  }

  @DeleteMapping("/{channelId}/users/{userId}")
  public Channel removeUserFromChannel(
      @PathVariable String channelId,
      @PathVariable String userId,
      @RequestParam String requesterId) {
    return channelService.removeUserFromChannel(channelId, userId, requesterId);
  }

  @GetMapping("/user/{userId}")
  public List<Channel> getUserChannels(@PathVariable String userId) {
    return channelService.getUserChannels(userId);
  }

  @GetMapping("/dm/{userId}")
  public List<Channel> getUserDirectMessages(@PathVariable String userId) {
    return channelService.getUserDirectMessages(userId);
  }

  @PostMapping("/dm")
  public Channel getOrCreateDirectMessageChannel(@RequestBody Map<String, String> users) {
    String user1Id = users.get("user1Id");
    String user2Id = users.get("user2Id");
    return channelService.getOrCreateDirectMessageChannel(user1Id, user2Id);
  }
}
