package com.example.soen341_backend.message;

import com.example.soen341_backend.channel.Channel;
import com.example.soen341_backend.channel.ChannelService;
import com.example.soen341_backend.exceptions.ResourceNotFoundException;
import com.example.soen341_backend.exceptions.UnauthorizedException;
import com.example.soen341_backend.storage.StorageService;
import com.example.soen341_backend.storage.StorageServiceFactory;
import com.example.soen341_backend.user.User;
import com.example.soen341_backend.user.UserRepository;
import com.example.soen341_backend.user.UserService;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Slf4j
@Service
@AllArgsConstructor
public class MessageService {

  private final MessageRepository messageRepository;
  private final UserRepository userRepository;
  private final ChannelService channelService;
  private final StorageServiceFactory storageServiceFactory;
  private final AttachmentRepository attachmentRepository;
  private final UserService userService;
  private final SimpMessagingTemplate messagingTemplate;

  public Message getMessageById(String id) {
    return messageRepository
        .findById(id)
        .orElseThrow(() -> new ResourceNotFoundException("Message not found with id: " + id));
  }

  public List<Message> getChannelMessages(String channelId, String username) {
    /**
     * Retrieves a list of messages for a specified channel.
     *
     * @param channelId the unique identifier of the channel (type: {@link String}).
     * @param username the username of the requesting user (type: {@link String}).
     *     <p>Validates whether the user is a member of the specified channel before fetching
     *     messages. If the user is not a member, an {@link UnauthorizedException} is thrown.
     * @return a list of messages ordered by timestamp in ascending order (type: {@link
     *     List<Message>}).
     */

    // Verify user is a member of the channel
    Channel channel = channelService.getChannelById(channelId);
    Optional<User> user = userRepository.findByUsername(username);

    if (user.isPresent() && !channel.getMembers().contains(user.get().getId())) {
      throw new UnauthorizedException("You don't have access to this channel");
    }

    return messageRepository.findAllByChannelIdOrderByTimestampAsc(channelId);
  }

  public List<Message> getDirectMessages(String username, String otherUserId) {
    /**
     * Retrieves a list of direct messages between the requesting user and another user.
     *
     * @param username the username of the requesting user (type: {@link String}).
     * @param otherUserId the unique identifier of the other user in the conversation (type: {@link
     *     String}).
     *     <p>Validates that the requesting user exists before fetching messages. If the user is not
     *     found, a {@link ResourceNotFoundException} is thrown.
     * @return a list of direct messages exchanged between the two users, ordered by timestamp in
     *     ascending order (type: {@link List<Message>}).
     */
    Optional<User> user = userRepository.findByUsername(username);

    if (user.isEmpty()) {
      throw new ResourceNotFoundException("User not found with username: " + username);
    }
    return messageRepository
        .findByDirectMessageTrueAndSenderIdAndReceiverIdOrDirectMessageTrueAndSenderIdAndReceiverIdOrderByTimestampAsc(
            user.get().getId(), otherUserId, otherUserId, user.get().getId());
  }

  public Message sendChannelMessage(Message message, String senderId) {
    /**
     * Sends a message to a specified channel.
     *
     * @param message the message object containing content, channel ID, and metadata (type: {@link
     *     Message}).
     * @param senderId the unique identifier of the user sending the message (type: {@link String}).
     *     <p>Validates that the sender exists and is a member of the target channel. If the user is
     *     not found, a {@link ResourceNotFoundException} is thrown. If the user is not a channel
     *     member, an {@link UnauthorizedException} is thrown.
     * @return the saved message object after persistence (type: {@link Message}).
     */
    Channel channel = channelService.getChannelById(message.getChannelId());

    User user =
        userRepository
            .findById(senderId)
            .orElseThrow(
                () -> new ResourceNotFoundException("User not found with username: " + senderId));

    // Verify user is a member of the channel
    if (!channel.getMembers().contains(user.getId())) {
      throw new UnauthorizedException("You don't have access to this channel");
    }

    return messageRepository.save(message);
  }

  public Message sendDirectMessage(Message message, String senderUsername, String recipientId) {
    /**
     * Sends a direct message between two users.
     *
     * @param message the message object containing content and metadata (type: {@link Message}).
     * @param senderUsername the username of the sender (type: {@link String}).
     * @param recipientId the unique identifier of the recipient (type: {@link String}).
     *     <p>Retrieves the sender's user details and gets or creates a direct message channel
     *     between the users. Updates the message with sender ID, recipient ID, channel ID,
     *     timestamp, and direct message status before saving.
     * @return the saved message object after persistence (type: {@link Message}).
     */

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

  /**
   * Sends a message to a channel with optional file attachments
   *
   * @param message the message containing content and channelId
   * @param username the username of the sender
   * @param files optional array of files to attach to the message
   * @return the saved message with attachments
   */
  public Message sendMessageWithAttachments(
      Message message, String username, MultipartFile[] files) {
    try {
      log.info("Processing message with attachments for user: {}", username);

      Optional<User> userOpt = userRepository.findByUsername(username);
      if (userOpt.isEmpty()) {
        log.error("User not found: {}", username);
        throw new ResourceNotFoundException("User not found with username: " + username);
      }

      User user = userOpt.get();
      Channel channel = channelService.getChannelById(message.getChannelId());
      log.info("Found channel: {}", channel.getId());

      // Verify user is a member of the channel
      if (!channel.getMembers().contains(user.getId())) {
        log.error("User {} is not a member of channel {}", user.getId(), channel.getId());
        throw new UnauthorizedException("You don't have access to this channel");
      }

      // Set message properties
      message.setSenderId(user.getId());
      message.setSenderUsername(user.getUsername());
      message.setTimestamp(Instant.now());

      // Save the message first to get an ID
      Message savedMessage = messageRepository.save(message);
      log.info("Saved message with ID: {}", savedMessage.getId());

      // Process any attachments
      List<Attachment> attachments = new ArrayList<>();
      if (files != null && files.length > 0) {
        log.info("Processing {} attachments", files.length);

        // Get the appropriate storage service
        StorageService storageService = storageServiceFactory.getStorageService();

        for (MultipartFile file : files) {
          if (!file.isEmpty()) {
            log.info(
                "Processing attachment: {} ({} bytes)", file.getOriginalFilename(), file.getSize());
            Attachment attachment = storageService.storeFile(file, savedMessage.getId());
            attachments.add(attachment);
            log.info("Successfully processed attachment: {}", attachment.getId());
          }
        }
      }

      // Set attachments on the returned message
      savedMessage.setAttachments(attachments);
      log.info("Message processing completed successfully");

      return savedMessage;
    } catch (Exception e) {
      log.error("Failed to process message with attachments", e);
      throw e;
    }
  }

  /**
   * Sends a direct message with optional file attachments
   *
   * @param message the message content
   * @param senderUsername the username of the sender
   * @param recipientId the ID of the recipient
   * @param files optional array of files to attach to the message
   * @return the saved message with attachments
   */
  public Message sendDirectMessageWithAttachments(
      Message message, String senderUsername, String recipientId, MultipartFile[] files) {

    // Get users
    Optional<User> senderOpt = userRepository.findByUsername(senderUsername);
    if (senderOpt.isEmpty()) {
      throw new ResourceNotFoundException("Sender not found with username: " + senderUsername);
    }

    User sender = senderOpt.get();

    // Get or create DM channel
    Channel dmChannel = channelService.getOrCreateDirectMessageChannel(sender.getId(), recipientId);

    // Set message properties
    message.setSenderId(sender.getId());
    message.setSenderUsername(sender.getUsername());
    message.setReceiverId(recipientId);
    message.setChannelId(dmChannel.getId());
    message.setTimestamp(Instant.now());
    message.setDirectMessage(true);

    // Save the message first to get an ID
    Message savedMessage = messageRepository.save(message);

    // Process any attachments
    List<Attachment> attachments = new ArrayList<>();
    if (files != null && files.length > 0) {
      for (MultipartFile file : files) {
        if (!file.isEmpty()) {
          Attachment attachment =
              storageServiceFactory.getStorageService().storeFile(file, savedMessage.getId());
          attachments.add(attachment);
        }
      }
    }

    // Set attachments on the returned message
    savedMessage.setAttachments(attachments);

    return savedMessage;
  }

  public void deleteMessage(String messageId, String username) {
    Message message = getMessageById(messageId);
    Optional<User> user = userRepository.findByUsername(username);

    if (user.isEmpty()) {
      throw new ResourceNotFoundException("User not found with username: " + username);
    }

    // Only message sender or admin can delete a message
    if (!message.getSenderId().equals(user.get().getId())
        && !userService.isAdmin(user.get().getId(), message.getChannelId())) {
      throw new UnauthorizedException("You don't have permission to delete this message");
    }

    // Delete any attachments
    List<Attachment> attachments = attachmentRepository.findByMessageId(messageId);
    for (Attachment attachment : attachments) {
      // Use the appropriate storage service based on where the file is stored
      StorageService storageService =
          storageServiceFactory.getStorageService(attachment.isS3Storage());
      storageService.deleteFile(attachment.getFileName());
      attachmentRepository.delete(attachment);
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

  public Message editMessage(String messageId, String username, Message editedMessage) {
    Message messageToEdit = getMessageById(messageId);
    Optional<User> user = userRepository.findByUsername(username);

    if (user.isEmpty()) {
      throw new ResourceNotFoundException("User not found with username: " + username);
    }

    // Only message sender and admin can edit a message
    if (!messageToEdit.getSenderId().equals(user.get().getId())
        && !userService.isAdmin(user.get().getId(), messageToEdit.getChannelId())) {
      throw new UnauthorizedException("You don't have permission to edit this message");
    }

    // Update message content
    messageToEdit.setContent(editedMessage.getContent());
    // Save the updated message
    Message savedMessage = messageRepository.save(messageToEdit);

    // Create notification about message update
    Map<String, Object> notification = new HashMap<>();
    notification.put("type", "Message updated");
    notification.put("messageId", messageId);
    notification.put("editedBy", user.get().getId());
    notification.put("message", savedMessage);

    // For channel messages, broadcast to the channel
    if (!messageToEdit.isDirectMessage()) {
      messagingTemplate.convertAndSend(
          "/topic/channel/" + messageToEdit.getChannelId(), notification);
    } else {
      messagingTemplate.convertAndSendToUser(
          messageToEdit.getSenderId(), "/direct-messages", notification);

      messagingTemplate.convertAndSendToUser(
          messageToEdit.getReceiverId(), "/direct-messages", notification);
    }

    return savedMessage;
  }
}
