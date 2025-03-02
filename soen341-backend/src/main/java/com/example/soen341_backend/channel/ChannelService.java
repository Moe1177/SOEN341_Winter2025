package com.example.soen341_backend.channel;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.Random;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class ChannelService {

  private final ChannelRepository channelRepository;

  public Channel createChannel(String name, String creatorId) {
    String inviteCode = generateInviteCode();

    Member admin = new Member(creatorId, "admin", Instant.now(), Instant.now());

    Channel channel =
        Channel.builder()
            .name(name)
            .creatorId(creatorId)
            .inviteCode(inviteCode)
            .members(List.of(admin))
            .build();

    return channelRepository.save(channel);
  }

  public Optional<Channel> joinChannel(String inviteCode, String userId) {
    Optional<Channel> optionalChannel = channelRepository.findByInviteCode(inviteCode);

    if (optionalChannel.isPresent()) {
      Channel channel = optionalChannel.get();
      boolean isAlreadyMember =
          channel.getMembers().stream().anyMatch(member -> member.getUserId().equals(userId));

      if (!isAlreadyMember) {
        channel.getMembers().add(new Member(userId, "member", Instant.now(), Instant.now()));
        channelRepository.save(channel);
      }

      return Optional.of(channel);
    }

    return Optional.empty();
  }

  private String generateInviteCode() {
    Random random = new Random();
    return String.format("%06d", random.nextInt(1000000));
  }
}
