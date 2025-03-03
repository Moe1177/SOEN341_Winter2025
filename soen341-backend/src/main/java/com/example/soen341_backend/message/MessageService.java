package com.example.soen341_backend.message;

import com.example.soen341_backend.channel.Channel;
import com.example.soen341_backend.channel.ChannelService;
import com.example.soen341_backend.exceptions.ResourceNotFoundException;
import com.example.soen341_backend.exceptions.UnauthorizedException;
import com.example.soen341_backend.user.User;
import com.example.soen341_backend.user.UserRepository;
import com.example.soen341_backend.user.UserService;
import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import lombok.AllArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

@Service
@AllArgsConstructor
public class MessageService {

  private final MessageRepository messageRepository;
  private final ChannelService channelService;
  private final UserService userService;
  private final SimpMessagingTemplate messagingTemplate;
  private final UserRepository userRepository;

  public Message getMessageById(String id) {
    return messageRepository
        .findById(id)
        .orElseThrow(() -> new ResourceNotFoundException("Message not found with id: " + id));
  }

  public List<Message> getChannelMessages(String channelId, String username) {
    // Verify user is a member of the channel
    Channel channel = channelService.getChannelById(channelId);
    Optional<User> user = userRepository.findByUsername(username);

    if (user.isPresent() && !channel.getMembers().contains(user.get().getId())) {
      throw new UnauthorizedException("You don't have access to this channel");
    }

    return messageRepository.findAllByChannelIdOrderByTimestampAsc(channelId);
  }

  public List<Message> getDirectMessages(String username, String otherUserId) {
    Optional<User> user = userRepository.findByUsername(username);

    if (user.isEmpty()) {
      throw new ResourceNotFoundException("User not found with username: " + username);
    }
    return messageRepository
        .findByDirectMessageTrueAndSenderIdAndReceiverIdOrDirectMessageTrueAndSenderIdAndReceiverIdOrderByTimestampAsc(
            user.get().getId(), otherUserId, otherUserId, user.get().getId());
  }

  public Message sendChannelMessage(Message message, String username) {
    Channel channel = channelService.getChannelById(message.getChannelId());

    User user =
        userRepository
            .findByUsername(username)
            .orElseThrow(
                () -> new ResourceNotFoundException("User not found with username: " + username));

    // Verify user is a member of the channel
    if (!channel.getMembers().contains(user.getId())) {
      throw new UnauthorizedException("You don't have access to this channel");
    }

    message.setSenderId(user.getId());
    message.setTimestamp(Instant.now());
    message.setDirectMessage(false);
    message.setReceiverId(null);

    return messageRepository.save(message);
  }

  public Message sendDirectMessage(Message message, String senderUsername, String recipientId) {
    // Get users
    Optional<User> sender = userRepository.findByUsername(senderUsername);
    // Get or create DM channel
    Channel dmChannel =
        channelService.getOrCreateDirectMessageChannel(sender.get().getId(), recipientId);

    message.setSenderId(sender.get().getId());
    message.setReceiverId(recipientId);
    message.setChannelId(dmChannel.getId());
    message.setTimestamp(Instant.now());
    message.setDirectMessage(true);

    return messageRepository.save(message);
  }

  public void deleteMessage(String messageId, String username) {
    Message message = getMessageById(messageId);
    Optional<User> user = userRepository.findByUsername(username);

    // Only message sender or admin can delete a message
    if (!message.getSenderId().equals(user.get().getId())
        && !userService.isAdmin(user.get().getId(), message.getChannelId())) {
      throw new UnauthorizedException("You don't have permission to delete this message");
    }

    // Delete from database
    messageRepository.delete(message);

    // Create notification about message deletion
    Map<String, Object> notification = new HashMap<>();
    notification.put("type", "MESSAGE_DELETED");
    notification.put("messageId", messageId);
    notification.put("deletedBy", user.get().getId());

    // For channel messages, broadcast to the channel
    if (!message.isDirectMessage()) {
      messagingTemplate.convertAndSend("/topic/channel/" + message.getChannelId(), notification);
    } else {
      // For direct messages, notify both parties
      messagingTemplate.convertAndSend("/queue/user/" + message.getSenderId(), notification);
      messagingTemplate.convertAndSend("/queue/user/" + message.getReceiverId(), notification);
    }
  }
}
