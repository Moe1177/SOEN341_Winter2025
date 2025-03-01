package com.example.soen341_backend.message;

import com.example.soen341_backend.channel.Channel;
import com.example.soen341_backend.channel.ChannelService;
import com.example.soen341_backend.exceptions.ResourceNotFoundException;
import com.example.soen341_backend.exceptions.UnauthorizedException;
import com.example.soen341_backend.user.UserService;
import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
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

  public Message getMessageById(String id) {
    return messageRepository
        .findById(id)
        .orElseThrow(() -> new ResourceNotFoundException("Message not found with id: " + id));
  }

  public List<Message> getChannelMessages(String channelId, String userId) {
    // Verify user is a member of the channel
    Channel channel = channelService.getChannelById(channelId);
    if (!channel.getMembers().contains(userId)) {
      throw new UnauthorizedException("You don't have access to this channel");
    }

    return messageRepository.findAllByChannelIdOrderByTimestampAsc(channelId);
  }

  public List<Message> getDirectMessages(String userId, String otherUserId) {
    return messageRepository
        .findByDirectMessageTrueAndSenderIdAndReceiverIdOrDirectMessageTrueAndSenderIdAndReceiverIdOrderByTimestampAsc(
            userId, otherUserId, otherUserId, userId);
  }

  public Message sendChannelMessage(Message message, String userId) {
    Channel channel = channelService.getChannelById(message.getChannelId());

    // Verify user is a member of the channel
    if (!channel.getMembers().contains(userId)) {
      throw new UnauthorizedException("You don't have access to this channel");
    }

    message.setSenderId(userId);
    message.setTimestamp(Instant.now());
    message.setDirectMessage(false);
    message.setReceiverId(null);

    return messageRepository.save(message);
  }

  public Message sendDirectMessage(Message message, String senderId, String recipientId) {
    // Get or create DM channel
    Channel dmChannel = channelService.getOrCreateDirectMessageChannel(senderId, recipientId);

    message.setSenderId(senderId);
    message.setReceiverId(recipientId);
    message.setChannelId(dmChannel.getId());
    message.setTimestamp(Instant.now());
    message.setDirectMessage(true);

    return messageRepository.save(message);
  }

  public void deleteMessage(String messageId, String userId) {
    Message message = getMessageById(messageId);

    // Only message sender or admin can delete a message
    if (!message.getSenderId().equals(userId)
        && !userService.isAdmin(userId, message.getChannelId())) {
      throw new UnauthorizedException("You don't have permission to delete this message");
    }

    // Delete from database
    messageRepository.delete(message);

    // Create notification about message deletion
    Map<String, Object> notification = new HashMap<>();
    notification.put("type", "MESSAGE_DELETED");
    notification.put("messageId", messageId);
    notification.put("deletedBy", userId);

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
