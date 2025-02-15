package com.example.soen341_backend.message;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;

@Service
@RequiredArgsConstructor
public class MessageService {

    private final MessageRepository messageRepository;

    public Message saveMessage(Message message) {
        message.setTimestamp(Instant.now());
        return messageRepository.save(message);
    }

    public List<Message> getMessagesForUser(String receiverId) {
        return messageRepository.findByReceiverId(receiverId);
    }

    public List<Message> getMessagesForChannel(String channelId) {
        return messageRepository.findByChannelId(channelId);
    }

    public List<Message> getMessagesForSender(String senderId) {
        return messageRepository.findBySenderId(senderId);
    }

    public void deleteMessage(String messageId) {
        messageRepository.deleteById(messageId);
    }

    public Message editMessage(String messageId, String newContent) {
        Message message = messageRepository.findById(messageId).orElseThrow(() -> new RuntimeException("Message not found"));

        message.setContent(newContent);
        return messageRepository.save(message);
    }

}
