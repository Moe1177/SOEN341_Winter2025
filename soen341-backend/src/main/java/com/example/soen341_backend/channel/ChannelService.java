package com.example.soen341_backend.channel;

import com.example.soen341_backend.exceptions.ResourceNotFoundException;
import com.example.soen341_backend.exceptions.UnauthorizedException;
import com.example.soen341_backend.user.User;
import com.example.soen341_backend.user.UserService;
import java.util.*;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@AllArgsConstructor
public class ChannelService {

  private final ChannelRepository channelRepository;
  private final UserService userService;

  public List<Channel> getAllChannels() {
    return channelRepository.findByIsDirectMessageFalse();
  }

  public Channel getChannelById(String id) {
    return channelRepository
        .findById(id)
        .orElseThrow(() -> new ResourceNotFoundException("Channel not found with id: " + id));
  }

  public Channel createChannel(Channel channel, String creatorUserId) {

    // Set default values if not provided
    if (channel.getMembers() == null) {
      channel.setMembers(new HashSet<>());
    }

    // Add creator to the channel members
    channel.getMembers().add(creatorUserId);

    String inviteCode = generateInviteCode();
    channel.setInviteCode(inviteCode);

    channel.setCreatorId(creatorUserId);
    channel.setChannelType(ChannelType.GROUP);

    Channel savedChannel = channelRepository.save(channel);

    // Update user's channels list
    userService.addChannelToUser(creatorUserId, savedChannel.getId());
    userService.addAdminChannelToUser(creatorUserId, savedChannel.getId());

    return savedChannel;
  }

  public Channel updateChannel(String id, Channel channelDetails, String userId) {

    Channel channel = getChannelById(id);

    userService.validateAdminRole(userId, channel.getId());
    channel.setName(channelDetails.getName());

    return channelRepository.save(channel);
  }

  public void deleteChannel(String id, String userId) {
    Channel channel = getChannelById(id);
    userService.validateAdminRole(userId, channel.getId());

    // Remove channel from all users' channels list
    for (String memberId : channel.getMembers()) {
      userService.removeChannelFromUser(memberId, id);
    }

    channelRepository.delete(channel);
  }

  public Channel addUserToChannel(String channelId, String userId) {
    Channel channel = getChannelById(channelId);
    channel.getMembers().add(userId);

    Channel updatedChannel = channelRepository.save(channel);
    userService.addChannelToUser(userId, channelId);

    return updatedChannel;
  }

  public Channel removeUserFromChannel(String channelId, String userId, String requesterId) {
    // Only admin or the user themselves can remove a user from a channel
    if (!userService.isAdmin(requesterId, channelId) && !userId.equals(requesterId)) {
      throw new UnauthorizedException("You don't have permission to remove this user");
    }

    Channel channel = getChannelById(channelId);
    channel.getMembers().remove(userId);

    Channel updatedChannel = channelRepository.save(channel);
    userService.removeChannelFromUser(userId, channelId);

    return updatedChannel;
  }

  public Channel getOrCreateDirectMessageChannel(String user1Id, String user2Id) {
    // Check if users exist
    User user1 = userService.getUserById(user1Id);
    User user2 = userService.getUserById(user2Id);

    // Try to find existing DM channel
    List<Channel> user1Channels = channelRepository.findIfMemberIsInDirectMessage(user1Id);

    for (Channel channel : user1Channels) {
      if (channel.getDirectMessageMembers().contains(user2Id)) {
        return channel;
      }
    }

    // Create new DM channel if not exists
    Channel dmChannel = new Channel();
    dmChannel.setName("DM: " + user1.getUsername() + " & " + user2.getUsername());
    dmChannel.setDirectMessage(true);

    Set<String> participants = new HashSet<>();
    participants.add(user1Id);
    participants.add(user2Id);
    dmChannel.setDirectMessageMembers(participants);
    dmChannel.setMembers(participants);

    String token = generateInviteCode();
    dmChannel.setInviteCode(token);
    dmChannel.setChannelType(ChannelType.DIRECT);

    Channel savedChannel = channelRepository.save(dmChannel);

    // Add to users' direct message lists
    userService.addDirectMessageToUser(user1Id, user2Id);
    userService.addDirectMessageToUser(user2Id, user1Id);

    return savedChannel;
  }

  public List<Channel> getUserChannels(String userId) {
    User user = userService.getUserById(userId);
    return channelRepository.findAllById(user.getChannelIds());
  }

  public List<Channel> getUserDirectMessages(String userId) {
    User user = userService.getUserById(userId);

    if (user == null) {
      throw new ResourceNotFoundException("User not found with id: " + userId);
    }

    List<Channel> directMessages = channelRepository.findIfMemberIsInDirectMessage(userId);

    // Optional logging or validation
    if (directMessages.isEmpty()) {
      System.out.println("No direct messages found for user: " + userId);
    }

    return directMessages;
  }

  private String generateInviteCode() {
    Random random = new Random();
    return String.format("%06d", random.nextInt(1000000));
  }
}
