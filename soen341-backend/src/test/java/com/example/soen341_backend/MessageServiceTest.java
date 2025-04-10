package com.example.soen341_backend;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import com.example.soen341_backend.channel.Channel;
import com.example.soen341_backend.channel.ChannelService;
import com.example.soen341_backend.exceptions.ResourceNotFoundException;
import com.example.soen341_backend.exceptions.UnauthorizedException;
import com.example.soen341_backend.message.Message;
import com.example.soen341_backend.message.MessageRepository;
import com.example.soen341_backend.message.MessageService;
import com.example.soen341_backend.user.User;
import com.example.soen341_backend.user.UserRepository;
import com.example.soen341_backend.user.UserService;
import java.time.Instant;
import java.util.Collections;
import java.util.Map;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.messaging.simp.SimpMessagingTemplate;

@ExtendWith(MockitoExtension.class)
public class MessageServiceTest {

  @Mock private MessageRepository messageRepository;

  @Mock private ChannelService channelService;

  @Mock private UserService userService;

  @Mock private SimpMessagingTemplate messagingTemplate;

  @Mock private UserRepository userRepository;

  @InjectMocks private MessageService messageService;

  private User testUser;
  private Channel testChannel;
  private Message testMessage;

  @BeforeEach
  public void setUp() {
    testUser = new User();
    testUser.setId("user-1");
    testUser.setUsername("testuser");

    testChannel = new Channel();
    testChannel.setId("channel-1");
    // Use a Set of Strings instead of a List.
    testChannel.setMembers(Collections.singleton("user-1"));

    testMessage = new Message();
    testMessage.setId("message-1");
    testMessage.setChannelId("channel-1");
    testMessage.setSenderId("user-1");
    testMessage.setTimestamp(Instant.now());
    testMessage.setContent("Hello World");
    testMessage.setDirectMessage(false);
  }

  @Test
  public void testGetMessageById_Success() {
    when(messageRepository.findById("message-1")).thenReturn(Optional.of(testMessage));

    Message result = messageService.getMessageById("message-1");

    assertNotNull(result);
    assertEquals("message-1", result.getId());
    verify(messageRepository, times(1)).findById("message-1");
  }

  @Test
  public void testGetMessageById_NotFound() {
    when(messageRepository.findById(anyString())).thenReturn(Optional.empty());

    ResourceNotFoundException thrown =
        assertThrows(
            ResourceNotFoundException.class,
            () -> messageService.getMessageById("nonexistent"),
            "Expected getMessageById() to throw, but it didn't");

    assertTrue(thrown.getMessage().contains("Message not found with id"));
  }

  @Test
  public void testGetChannelMessages_Success() {
    // Setup: find user and channel
    when(channelService.getChannelById("channel-1")).thenReturn(testChannel);
    when(userRepository.findByUsername("testuser")).thenReturn(Optional.of(testUser));
    when(messageRepository.findAllByChannelIdOrderByTimestampAsc("channel-1"))
        .thenReturn(Collections.singletonList(testMessage));

    // Execute
    var messages = messageService.getChannelMessages("channel-1", "testuser");

    // Verify
    assertNotNull(messages);
    assertEquals(1, messages.size());
    verify(messageRepository, times(1)).findAllByChannelIdOrderByTimestampAsc("channel-1");
  }

  @Test
  public void testGetChannelMessages_Unauthorized() {
    // Setup: User exists but is not a member of the channel
    testChannel.setMembers(Collections.singleton("another-user"));
    when(channelService.getChannelById("channel-1")).thenReturn(testChannel);
    when(userRepository.findByUsername("testuser")).thenReturn(Optional.of(testUser));

    // Execute & Verify
    UnauthorizedException thrown =
        assertThrows(
            UnauthorizedException.class,
            () -> messageService.getChannelMessages("channel-1", "testuser"));
    assertTrue(thrown.getMessage().contains("access"));
  }

  @Test
  public void testGetDirectMessages_Success() {
    // Setup: requester user exists and messages are returned
    when(userRepository.findByUsername("testuser")).thenReturn(Optional.of(testUser));
    when(messageRepository
            .findByDirectMessageTrueAndSenderIdAndReceiverIdOrDirectMessageTrueAndSenderIdAndReceiverIdOrderByTimestampAsc(
                eq("user-1"), eq("user-2"), eq("user-2"), eq("user-1")))
        .thenReturn(Collections.singletonList(testMessage));

    var messages = messageService.getDirectMessages("testuser", "user-2");

    assertNotNull(messages);
    assertEquals(1, messages.size());
  }

  @Test
  public void testGetDirectMessages_UserNotFound() {
    // Setup: requester user does not exist
    when(userRepository.findByUsername("unknown")).thenReturn(Optional.empty());

    ResourceNotFoundException thrown =
        assertThrows(
            ResourceNotFoundException.class,
            () -> messageService.getDirectMessages("unknown", "user-2"));
    assertTrue(thrown.getMessage().contains("User not found"));
  }

  @Test
  public void testSendChannelMessage_Success() {
    // Setup for sending a channel message
    Message newMessage = new Message();
    newMessage.setChannelId("channel-1");
    newMessage.setContent("Test channel message");

    when(channelService.getChannelById("channel-1")).thenReturn(testChannel);
    when(userRepository.findById("user-1")).thenReturn(Optional.of(testUser));
    when(messageRepository.save(any(Message.class))).thenReturn(newMessage);

    Message savedMessage = messageService.sendChannelMessage(newMessage, "user-1");

    assertNotNull(savedMessage);
    assertEquals("Test channel message", savedMessage.getContent());
    verify(messageRepository, times(1)).save(newMessage);
  }

  @Test
  public void testSendChannelMessage_Unauthorized() {
    // Setup: User is not a member of the channel
    Message newMessage = new Message();
    newMessage.setChannelId("channel-1");
    newMessage.setContent("Test channel message");

    // Change testChannel members so that testUser is not a member
    testChannel.setMembers(Collections.singleton("another-user"));
    when(channelService.getChannelById("channel-1")).thenReturn(testChannel);
    when(userRepository.findById("user-1")).thenReturn(Optional.of(testUser));

    UnauthorizedException thrown =
        assertThrows(
            UnauthorizedException.class,
            () -> messageService.sendChannelMessage(newMessage, "user-1"));
    assertTrue(thrown.getMessage().contains("access"));
  }

  @Test
  public void testSendDirectMessage_Success() {
    // Setup: Direct message test
    Message directMsg = new Message();
    directMsg.setContent("Direct Hello");
    // Suppose that the DM channel is created/retrieved with an id "dm-channel-1"
    Channel dmChannel = new Channel();
    dmChannel.setId("dm-channel-1");

    when(userRepository.findByUsername("testuser")).thenReturn(Optional.of(testUser));
    when(channelService.getOrCreateDirectMessageChannel("user-1", "user-2")).thenReturn(dmChannel);
    when(messageRepository.save(any(Message.class)))
        .thenAnswer(invocation -> invocation.getArgument(0));

    Message savedMsg = messageService.sendDirectMessage(directMsg, "testuser", "user-2");

    assertNotNull(savedMsg);
    assertEquals("user-1", savedMsg.getSenderId());
    assertEquals("user-2", savedMsg.getReceiverId());
    assertEquals("dm-channel-1", savedMsg.getChannelId());
    assertTrue(savedMsg.isDirectMessage());
  }

  @Test
  public void testDeleteMessage_Success_ChannelMessage() {
    // Setup for channel message deletion
    // testMessage is a channel message
    when(messageRepository.findById("message-1")).thenReturn(Optional.of(testMessage));
    when(userRepository.findByUsername("testuser")).thenReturn(Optional.of(testUser));
    // Simulate that the user is the sender (or admin). Here, the testUser is the sender.
    // Call the method under test
    messageService.deleteMessage("message-1", "testuser");

    // Verify deletion and notification sending
    verify(messageRepository, times(1)).delete(testMessage);
    verify(messagingTemplate, times(1))
        .convertAndSend(eq("/topic/channel/" + testMessage.getChannelId()), any(Map.class));
  }

  @Test
  public void testDeleteMessage_Unauthorized() {
    // Setup: testUser is not the sender and not an admin.
    Message otherMessage = new Message();
    otherMessage.setId("message-2");
    otherMessage.setChannelId("channel-1");
    otherMessage.setSenderId("other-user");
    otherMessage.setDirectMessage(false);

    when(messageRepository.findById("message-2")).thenReturn(Optional.of(otherMessage));
    when(userRepository.findByUsername("testuser")).thenReturn(Optional.of(testUser));
    // Simulate non-admin status
    when(userService.isAdmin("user-1", "channel-1")).thenReturn(false);

    UnauthorizedException thrown =
        assertThrows(
            UnauthorizedException.class,
            () -> messageService.deleteMessage("message-2", "testuser"));

    assertTrue(thrown.getMessage().contains("permission"));
    verify(messageRepository, never()).delete(any(Message.class));
  }

  @Test
  public void testEditMessage_Success_DirectMessage() {
    // Setup for editing a direct message
    Message originalMessage = new Message();
    originalMessage.setId("msg-edit-1");
    originalMessage.setChannelId("channel-1");
    originalMessage.setSenderId("user-1");
    originalMessage.setDirectMessage(true);
    originalMessage.setContent("Old Content");

    Message editedMessage = new Message();
    editedMessage.setContent("New Content");

    when(messageRepository.findById("msg-edit-1")).thenReturn(Optional.of(originalMessage));
    when(userRepository.findByUsername("testuser")).thenReturn(Optional.of(testUser));
    // Simulate that testUser is the sender
    when(messageRepository.save(any(Message.class)))
        .thenAnswer(invocation -> invocation.getArgument(0));

    Message result = messageService.editMessage("msg-edit-1", "testuser", editedMessage);

    assertNotNull(result);
    assertEquals("New Content", result.getContent());

    // Verify that messagingTemplate sends notifications to both sender and receiver for direct
    // messages
    verify(messagingTemplate, times(1))
        .convertAndSendToUser(
            eq(originalMessage.getSenderId()), eq("/direct-messages"), any(Map.class));
    verify(messagingTemplate, times(1))
        .convertAndSendToUser(
            eq(originalMessage.getReceiverId()), eq("/direct-messages"), any(Map.class));
  }

  @Test
  public void testEditMessage_Unauthorized() {
    // Setup: editing a message when the requester is neither the sender nor an admin.
    Message originalMessage = new Message();
    originalMessage.setId("msg-edit-2");
    originalMessage.setChannelId("channel-1");
    originalMessage.setSenderId("other-user");
    originalMessage.setDirectMessage(false);
    originalMessage.setContent("Original");

    Message editedMessage = new Message();
    editedMessage.setContent("Updated");

    when(messageRepository.findById("msg-edit-2")).thenReturn(Optional.of(originalMessage));
    when(userRepository.findByUsername("testuser")).thenReturn(Optional.of(testUser));
    when(userService.isAdmin("user-1", "channel-1")).thenReturn(false);

    UnauthorizedException thrown =
        assertThrows(
            UnauthorizedException.class,
            () -> messageService.editMessage("msg-edit-2", "testuser", editedMessage));
    assertTrue(thrown.getMessage().contains("permission"));
  }
}
