package com.example.soen341_backend;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import com.example.soen341_backend.channel.Channel;
import com.example.soen341_backend.channel.ChannelRepository;
import com.example.soen341_backend.channel.ChannelService;
import com.example.soen341_backend.channel.ChannelType;
import com.example.soen341_backend.exceptions.ResourceNotFoundException;
import com.example.soen341_backend.exceptions.UnauthorizedException;
import com.example.soen341_backend.user.User;
import com.example.soen341_backend.user.UserService;
import java.util.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
public class ChannelServiceTest {

  @Mock private ChannelRepository channelRepository;

  @Mock private UserService userService;

  @InjectMocks private ChannelService channelService;

  private Channel testChannel;
  private final String channelId = "channel-123";
  private final String creatorUserId = "user-123";

  @BeforeEach
  public void setup() {
    testChannel = new Channel();
    testChannel.setId(channelId);
    String channelName = "Test Channel";
    testChannel.setName(channelName);
    testChannel.setMembers(new HashSet<>());
    testChannel.setAdminIds(new HashSet<>());
    testChannel.setChannelType(ChannelType.GROUP);
  }

  @Test
  public void testGetAllChannels() {
    List<Channel> channels = Collections.singletonList(testChannel);
    when(channelRepository.findByIsDirectMessageFalse()).thenReturn(channels);

    List<Channel> result = channelService.getAllChannels();

    assertEquals(channels.size(), result.size());
    verify(channelRepository, times(1)).findByIsDirectMessageFalse();
  }

  @Test
  public void testGetChannelById_Found() {
    when(channelRepository.findById(channelId)).thenReturn(Optional.of(testChannel));

    Channel found = channelService.getChannelById(channelId);

    assertNotNull(found);
    assertEquals(channelId, found.getId());
  }

  @Test
  public void testGetChannelById_NotFound() {
    when(channelRepository.findById(channelId)).thenReturn(Optional.empty());

    Exception exception =
        assertThrows(
            ResourceNotFoundException.class, () -> channelService.getChannelById(channelId));

    assertTrue(exception.getMessage().contains("Channel not found with id: " + channelId));
  }

  @Test
  public void testCreateChannel_Success() {
    // Prepare an input channel without members set
    Channel inputChannel = new Channel();
    inputChannel.setName("New Channel");

    // Simulate saving the channel: assign an id on save
    when(channelRepository.save(any(Channel.class)))
        .thenAnswer(
            invocation -> {
              Channel c = invocation.getArgument(0);
              c.setId("new-channel");
              return c;
            });

    // Stub user service methods that update the user record
    doNothing().when(userService).addChannelToUser(eq(creatorUserId), anyString());
    doNothing().when(userService).addAdminChannelToUser(eq(creatorUserId), anyString());

    Channel created = channelService.createChannel(inputChannel, creatorUserId);

    // Validate that the creator is added as both a member and an admin
    assertTrue(created.getMembers().contains(creatorUserId));
    assertTrue(created.getAdminIds().contains(creatorUserId));
    assertEquals(ChannelType.GROUP, created.getChannelType());
    assertNotNull(created.getInviteCode());

    verify(channelRepository, times(1)).save(any(Channel.class));
    verify(userService, times(1)).addChannelToUser(creatorUserId, created.getId());
    verify(userService, times(1)).addAdminChannelToUser(creatorUserId, created.getId());
  }

  @Test
  public void testCreateChannel_DuplicateChannelName() {
    Channel inputChannel = new Channel();
    inputChannel.setName("Duplicate Channel");

    when(channelRepository.save(any(Channel.class)))
        .thenThrow(new RuntimeException("duplicate key error: name"));

    Exception exception =
        assertThrows(
            IllegalArgumentException.class,
            () -> channelService.createChannel(inputChannel, creatorUserId));

    assertEquals("A channel with this name already exists", exception.getMessage());
  }

  @Test
  public void testUpdateChannel_Success() {
    // Prepare channel update details
    String newName = "Updated Channel Name";
    Channel channelDetails = new Channel();
    channelDetails.setName(newName);

    when(channelRepository.findById(channelId)).thenReturn(Optional.of(testChannel));
    doNothing().when(userService).validateAdminRole(creatorUserId, channelId);
    when(channelRepository.save(any(Channel.class)))
        .thenAnswer(invocation -> invocation.getArgument(0));

    Channel updated = channelService.updateChannel(channelId, channelDetails, creatorUserId);

    assertEquals(newName, updated.getName());
    verify(userService, times(1)).validateAdminRole(creatorUserId, channelId);
    verify(channelRepository, times(1)).save(any(Channel.class));
  }

  @Test
  public void testDeleteChannel_Success() {
    // Add two members to the test channel
    testChannel.getMembers().add("user1");
    testChannel.getMembers().add("user2");

    when(channelRepository.findById(channelId)).thenReturn(Optional.of(testChannel));
    doNothing().when(userService).validateAdminRole(creatorUserId, channelId);
    // Replace doNothing() with when(...).thenReturn(null) if removeChannelFromUser returns a value.
    when(userService.removeChannelFromUser(anyString(), eq(channelId))).thenReturn(null);

    channelService.deleteChannel(channelId, creatorUserId);

    verify(channelRepository, times(1)).delete(testChannel);
    for (String member : testChannel.getMembers()) {
      verify(userService, times(1)).removeChannelFromUser(member, channelId);
    }
  }

  @Test
  public void testAddUserToChannel_Success() {
    String newUserId = "new-user";
    when(channelRepository.findById(channelId)).thenReturn(Optional.of(testChannel));
    when(channelRepository.save(any(Channel.class)))
        .thenAnswer(invocation -> invocation.getArgument(0));

    User user = new User();
    user.setId(newUserId);
    user.setChannelIds(new HashSet<>());
    when(userService.getUserById(newUserId)).thenReturn(user);
    doNothing().when(userService).saveUser(user);

    Channel updated = channelService.addUserToChannel(channelId, newUserId);

    assertTrue(updated.getMembers().contains(newUserId));
    verify(userService, times(1)).saveUser(user);
  }

  @Test
  public void testRemoveUserFromChannel_Unauthorized() {
    String requesterId = "not-admin";
    String targetUserId = "target-user";

    // Simulate that the requester is not an admin
    when(userService.isAdmin(requesterId, channelId)).thenReturn(false);

    Exception exception =
        assertThrows(
            UnauthorizedException.class,
            () -> channelService.removeUserFromChannel(channelId, targetUserId, requesterId));

    assertTrue(exception.getMessage().contains("You don't have permission"));
  }

  @Test
  public void testRemoveUserFromChannel_SelfRemoval() {
    when(userService.isAdmin(creatorUserId, channelId)).thenReturn(false);
    when(channelRepository.findById(channelId)).thenReturn(Optional.of(testChannel));

    testChannel.getMembers().add(creatorUserId);
    when(channelRepository.save(any(Channel.class)))
        .thenAnswer(invocation -> invocation.getArgument(0));
    // Use when(...).thenReturn(null) instead of doNothing()
    when(userService.removeChannelFromUser(creatorUserId, channelId)).thenReturn(null);

    Channel updated = channelService.removeUserFromChannel(channelId, creatorUserId, creatorUserId);

    assertFalse(updated.getMembers().contains(creatorUserId));
    verify(userService, times(1)).removeChannelFromUser(creatorUserId, channelId);
  }

  @Test
  public void testRemoveUserFromChannel_AdminRemoval() {
    String targetUserId = "target-user";
    when(userService.isAdmin(creatorUserId, channelId)).thenReturn(true);
    when(channelRepository.findById(channelId)).thenReturn(Optional.of(testChannel));

    testChannel.getMembers().add(targetUserId);
    when(channelRepository.save(any(Channel.class)))
        .thenAnswer(invocation -> invocation.getArgument(0));
    // Use when(...).thenReturn(null) here as well.
    when(userService.removeChannelFromUser(targetUserId, channelId)).thenReturn(null);

    Channel updated = channelService.removeUserFromChannel(channelId, targetUserId, creatorUserId);

    assertFalse(updated.getMembers().contains(targetUserId));
    verify(userService, times(1)).removeChannelFromUser(targetUserId, channelId);
  }

  @Test
  public void testGetOrCreateDirectMessageChannel_Existing() {
    String receiverId = "receiver-user";

    // Prepare sender and receiver users
    User sender = new User();
    sender.setId(creatorUserId);
    sender.setUsername("Sender");
    User receiver = new User();
    receiver.setId(receiverId);
    receiver.setUsername("Receiver");

    when(userService.getUserById(creatorUserId)).thenReturn(sender);
    when(userService.getUserById(receiverId)).thenReturn(receiver);

    // Create an existing DM channel with both participants
    Channel dmChannel = new Channel();
    dmChannel.setId("dm-channel");
    dmChannel.setDirectMessage(true);
    dmChannel.setDirectMessageMembers(new HashSet<>(Arrays.asList(creatorUserId, receiverId)));
    when(channelRepository.findIfMemberIsInDirectMessage(creatorUserId))
        .thenReturn(List.of(dmChannel));

    Channel result = channelService.getOrCreateDirectMessageChannel(creatorUserId, receiverId);

    assertEquals("dm-channel", result.getId());
  }

  @Test
  public void testGetOrCreateDirectMessageChannel_CreateNew() {
    String receiverId = "receiver-user";

    User sender = new User();
    sender.setId(creatorUserId);
    sender.setUsername("Sender");
    User receiver = new User();
    receiver.setId(receiverId);
    receiver.setUsername("Receiver");

    when(userService.getUserById(creatorUserId)).thenReturn(sender);
    when(userService.getUserById(receiverId)).thenReturn(receiver);
    when(channelRepository.findIfMemberIsInDirectMessage(creatorUserId))
        .thenReturn(Collections.emptyList());

    when(channelRepository.save(any(Channel.class)))
        .thenAnswer(
            invocation -> {
              Channel c = invocation.getArgument(0);
              c.setId("dm-new");
              return c;
            });
    // Use when(...).thenReturn(null) if addDirectMessageToUser returns a value.
    when(userService.addDirectMessageToUser(creatorUserId, receiverId)).thenReturn(null);
    when(userService.addDirectMessageToUser(receiverId, creatorUserId)).thenReturn(null);

    Channel result = channelService.getOrCreateDirectMessageChannel(creatorUserId, receiverId);

    assertNotNull(result.getId());
    assertEquals(ChannelType.DIRECT, result.getChannelType());
    assertTrue(result.getDirectMessageMembers().contains(creatorUserId));
    assertTrue(result.getDirectMessageMembers().contains(receiverId));
  }

  @Test
  public void testGetUserChannels() {
    // Prepare a user with a set of channel IDs
    User user = new User();
    user.setId(creatorUserId);
    Set<String> channelIds = new HashSet<>(Arrays.asList("channel1", "channel2"));
    user.setChannelIds(channelIds);
    when(userService.getUserById(creatorUserId)).thenReturn(user);

    // Prepare mock channels returned by repository
    List<Channel> channels = new ArrayList<>();
    Channel ch1 = new Channel();
    ch1.setId("channel1");
    Channel ch2 = new Channel();
    ch2.setId("channel2");
    channels.add(ch1);
    channels.add(ch2);
    when(channelRepository.findAllById(channelIds)).thenReturn(channels);

    List<Channel> result = channelService.getUserChannels(creatorUserId);
    assertEquals(2, result.size());
  }

  @Test
  public void testGetUserDirectMessages_Success() {
    // Setup a valid user
    User user = new User();
    user.setId(creatorUserId);
    when(userService.getUserById(creatorUserId)).thenReturn(user);

    // Create a list with one direct message channel
    List<Channel> dmChannels = new ArrayList<>();
    Channel dm = new Channel();
    dm.setId("dm-channel");
    dm.setDirectMessage(true);
    dmChannels.add(dm);
    when(channelRepository.findIfMemberIsInDirectMessage(creatorUserId)).thenReturn(dmChannels);

    List<Channel> result = channelService.getUserDirectMessages(creatorUserId);
    assertEquals(1, result.size());
  }

  @Test
  public void testGetUserDirectMessages_UserNotFound() {
    when(userService.getUserById(creatorUserId)).thenReturn(null);

    Exception exception =
        assertThrows(
            ResourceNotFoundException.class,
            () -> channelService.getUserDirectMessages(creatorUserId));
    assertTrue(exception.getMessage().contains("User not found with id: " + creatorUserId));
  }

  @Test
  public void testJoinChannelByInviteCode_Success() {
    String inviteCode = "123456";
    testChannel.setInviteCode(inviteCode);
    // Ensure the user is not already a member
    testChannel.getMembers().clear();

    when(channelRepository.findByInviteCode(inviteCode)).thenReturn(Optional.of(testChannel));
    when(channelRepository.save(any(Channel.class)))
        .thenAnswer(invocation -> invocation.getArgument(0));

    User user = new User();
    user.setId(creatorUserId);
    user.setChannelIds(new HashSet<>());
    when(userService.getUserById(creatorUserId)).thenReturn(user);
    doNothing().when(userService).saveUser(user);

    Channel result = channelService.joinChannelByInviteCode(inviteCode, creatorUserId);

    assertTrue(result.getMembers().contains(creatorUserId));
    verify(userService, times(1)).saveUser(user);
  }

  @Test
  public void testJoinChannelByInviteCode_UserAlreadyInChannel() {
    String inviteCode = "123456";
    testChannel.setInviteCode(inviteCode);
    testChannel.getMembers().add(creatorUserId);

    when(channelRepository.findByInviteCode(inviteCode)).thenReturn(Optional.of(testChannel));

    Exception exception =
        assertThrows(
            IllegalArgumentException.class,
            () -> channelService.joinChannelByInviteCode(inviteCode, creatorUserId));
    assertEquals("User is already in this channel", exception.getMessage());
  }

  @Test
  public void testPromoteUserToAdmin() {
    String userIdToPromote = "user-to-promote";
    User adminUser = new User();
    adminUser.setId(creatorUserId);
    adminUser.setUsername("AdminUser");

    when(userService.getUserByUsername("AdminUser")).thenReturn(adminUser);
    when(userService.isAdmin(creatorUserId, channelId)).thenReturn(true);
    when(channelRepository.findById(channelId)).thenReturn(Optional.of(testChannel));
    when(channelRepository.save(any(Channel.class)))
        .thenAnswer(invocation -> invocation.getArgument(0));
    doNothing().when(userService).addAdminChannelToUser(userIdToPromote, channelId);

    channelService.promoteUserToAdmin(channelId, userIdToPromote, "AdminUser");

    // Verify that the user has been added to the admin list
    assertTrue(testChannel.getAdminIds().contains(userIdToPromote));
    verify(userService, times(1)).addAdminChannelToUser(userIdToPromote, channelId);
  }
}
