package com.example.soen341_backend.server;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Optional;

@RestController
@RequestMapping("/api/server")
@RequiredArgsConstructor
public class ServerController {

    private final ServerService serverService;

    @PostMapping("/create")
    public ResponseEntity<Server> createServer(
            @RequestParam String name,
            @RequestParam String creatorId
    ) {
        Server server = serverService.createServer(name, creatorId);
        return ResponseEntity.ok(server);
    }

    @PostMapping("/join")
    public ResponseEntity<Server> joinServer(
            @RequestParam String inviteCode,
            @RequestParam String userId
    ) {
        Optional<Server> optionalServer= serverService.joinServer(inviteCode, userId);

        return optionalServer.map(
                ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }
}
