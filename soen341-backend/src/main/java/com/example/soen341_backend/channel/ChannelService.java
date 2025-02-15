package com.example.soen341_backend.channel;

import com.example.soen341_backend.server.Member;
import com.example.soen341_backend.server.ServerService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.Random;

@Service
@RequiredArgsConstructor
public class ChannelService {

    private final ChannelRepository channelRepository;
    private final ServerService serverService;

    public Channel createChannel(String name, String creatorId, String serverId) {

        Member admin = new Member(creatorId, "admin", Instant.now(), Instant.now());

        Channel channel = Channel.builder()
                .name(name)
                .creatorId(creatorId)
                .server(serverService.getServer(serverId))
                .build();

        return channelRepository.save(channel);
    }

    private String generateInviteCode() {
        Random random = new Random();
        return String.format("%06d", random.nextInt(1000000));
    }

}
