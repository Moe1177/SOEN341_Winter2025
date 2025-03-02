package com.example.soen341_backend.message;

import java.util.List;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface MessageRepository extends MongoRepository<Message, String> {

  List<Message> findByReceiverId(String receiverId);

  List<Message> findBySenderId(String senderId);

  List<Message> findByChannelId(String channelId);
}
