package com.example.soen341_backend.channel;

import java.util.Optional;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface ChannelRepository extends MongoRepository<Channel, String> {

  Optional<Channel> findByInviteCode(String inviteCode);
}
