package com.example.soen341_backend.channel;

import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;

@Controller
@RequiredArgsConstructor
@RequestMapping("/api/channel")
public class ChannelController {

  private final ChannelService channelService;

  @PostMapping("/create")
  public ResponseEntity<Channel> createChannel(
      @RequestParam String name, @RequestParam String creatorId) {
    Channel channel = channelService.createChannel(name, creatorId);
    return ResponseEntity.ok(channel);
  }

  @PostMapping("/join")
  public ResponseEntity<Channel> joinChannel(
      @RequestParam String inviteCode, @RequestParam String userId) {
    Optional<Channel> optionalChannel = channelService.joinChannel(inviteCode, userId);

    return optionalChannel
        .map(ResponseEntity::ok)
        .orElseGet(() -> ResponseEntity.notFound().build());
  }
}
