package com.example.soen341_backend.channel;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;


@Controller
@RequiredArgsConstructor
@RequestMapping("/api/server/{id}/channel")
public class ChannelController {

    private final ChannelService channelService;

    @PostMapping("/create")
    public ResponseEntity<Channel> createChannel(
            @RequestParam String name,
            @RequestParam String creatorId,
            @PathVariable("id") String serverId
    ) {
        Channel channel = channelService.createChannel(name, creatorId, serverId);
        return ResponseEntity.ok(channel);
    }

}