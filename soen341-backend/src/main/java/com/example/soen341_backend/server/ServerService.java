package com.example.soen341_backend.server;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.Random;

@Service
@RequiredArgsConstructor
public class ServerService {

    private final ServerRepository serverRepository;

    public Server createServer(String serverName, String creatorId) {
        String inviteCode = generateInviteCode();

        Member admin = new Member(creatorId, "admin", Instant.now(), Instant.now());

        Server server = Server.builder().
                name(serverName).
                inviteCode(inviteCode).
                members(List.of(admin)).
                channels(List.of()).
                build();

        return serverRepository.save(server);
    }

    public Optional<Server> joinServer(String inviteCode, String userId) {
        Optional<Server> optionalServer = serverRepository.findByInviteCode(inviteCode);

        if (optionalServer.isPresent()) {
            Server server = optionalServer.get();
            boolean isAlreadyMember = server.getMembers().stream().anyMatch(member -> member.getUserId().equals(userId));

            if (!isAlreadyMember) {
                server.getMembers().add(new Member(userId, "member", Instant.now(), Instant.now()));
                serverRepository.save(server);
            }

            return Optional.of(server);
        }

        return Optional.empty();
    }

    public Server getServer(String serverId) {

        Optional<Server> server = serverRepository.findById(serverId);
        return server.orElse(null);
    }

    private String generateInviteCode() {
        Random random = new Random();
        return String.format("%06d", random.nextInt(1000000));
    }
}
