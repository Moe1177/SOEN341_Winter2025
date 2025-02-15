package com.example.soen341_backend.server;

import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Optional;

public interface ServerRepository extends MongoRepository<Server, String> {
    Optional<Server> findByInviteCode(String inviteCode);
}
