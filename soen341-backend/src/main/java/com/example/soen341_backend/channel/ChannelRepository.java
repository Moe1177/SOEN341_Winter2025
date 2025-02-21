package com.example.soen341_backend.channel;

import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Optional;

public interface ChannelRepository extends MongoRepository<Channel, String> {

    Optional<Channel> findByInviteCode(String inviteCode);
}
