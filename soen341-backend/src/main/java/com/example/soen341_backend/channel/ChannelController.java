package com.example.soen341_backend.channel;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

@Controller
@RequiredArgsConstructor
@RequestMapping ("/api/server/{id}/channel")
public class ChannelController {

    private final ChannelService channelService;
    private String serverId;

    @PostMapping("/create")
    public ResponseEntity<Channel> createChannel(
            @RequestParam String name,
            @RequestParam String creatorId
    ) {
        Channel channel = channelService.createChannel(name, creatorId, serverId);
        return ResponseEntity.ok(channel);
    }

    // Reach the server page and channel management first
    @GetMapping("")
    public void setServerId(@PathVariable("id") String serverId) {
        this.serverId = serverId;
    }
}