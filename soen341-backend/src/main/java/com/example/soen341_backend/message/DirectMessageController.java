package com.example.soen341_backend.message;

import com.example.soen341_backend.user.User;
import com.example.soen341_backend.user.UserRepository;
import java.security.Principal;
import java.time.Instant;
import java.util.Optional;
import lombok.AllArgsConstructor;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.annotation.SendToUser;
import org.springframework.stereotype.Controller;

@Controller
@AllArgsConstructor
public class DirectMessageController {

  private final UserRepository userRepository;
  private final MessageService messageService;

  @MessageMapping("/dm/{receiverId}")
  @SendToUser("/queue/messages")
  public Message sendPrivateMessage(
      @DestinationVariable String receiverId, Message message, Principal sender) {

    if (message.getSenderId() == null || message.getSenderId().isEmpty()) {
      message.setSenderId("unknownSender"); // Default value for testing
    } else {
      Optional<User> user = userRepository.findByEmail(sender.getName());

      if (user.isPresent()) {
        message.setSenderId(user.get().getId());
        message.setReceiverId(receiverId);
      } else {
        throw new RuntimeException("User not found " + sender.getName());
      }
    }

    message.setTimestamp(Instant.now());

    return messageService.saveMessage(message);
  }
}
