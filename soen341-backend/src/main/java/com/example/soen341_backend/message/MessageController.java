package com.example.soen341_backend.message;

import com.example.soen341_backend.user.User;
import com.example.soen341_backend.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.stereotype.Controller;

import java.time.Instant;
import java.util.Optional;

@Controller
@RequiredArgsConstructor
public class MessageController {

    private final UserRepository userRepository;
    private final MessageService messageService;


    @MessageMapping("/chat/{channelId}")
    @SendTo("/topic/{channelId}")
    public Message sendChannelMessage(@DestinationVariable String channelId, Message message) {
        Optional<User> user = userRepository.findByUsername(message.getUsername());

        if (user.isPresent()) {
            message.setSenderId(user.get().getId());
            message.setChannelId(channelId);

        }

        message.setTimestamp(Instant.now());

        return messageService.saveMessage(message);
    }
}
