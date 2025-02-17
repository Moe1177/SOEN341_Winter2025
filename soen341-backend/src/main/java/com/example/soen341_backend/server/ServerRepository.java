package com.example.soen341_backend.server;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface ServerRepository extends MongoRepository<Server, String> {
    Optional<Server> findServerByInviteCode(String inviteCode);
}
