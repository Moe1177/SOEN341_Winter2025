package com.example.soen341_backend.message;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MessageRepository extends MongoRepository<Message, String> {

    List<Message> findByReceiverId(String receiverId);
    List<Message> findBySenderId(String senderId);
    List<Message> findByChannelId(String channelId);
}
