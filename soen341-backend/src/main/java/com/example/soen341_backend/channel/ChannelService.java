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
    /**
     * Creates a new group channel and assigns the creator as a member and admin.
     *
     * @param channel the channel object containing initial details (type: {@link Channel}).
     * @param creatorUserId the unique identifier of the user creating the channel (type: {@link
     *     String}).
     *     <p>If no members are provided, initializes an empty set. The creator is added to the
     *     channel members and assigned as an admin. An invite code is generated, and default
     *     properties such as channel type and direct message status are set. The created channel is
     *     saved, and the creator's user record is updated with the new channel.
     * @return the saved channel object after persistence (type: {@link Channel}).
     */

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
    channel.setDirectMessage(false);

    Channel savedChannel = channelRepository.save(channel);

    // Update user's channels list
    userService.addChannelToUser(creatorUserId, savedChannel.getId());
    userService.addAdminChannelToUser(creatorUserId, savedChannel.getId());

    return savedChannel;
  }

  public Channel updateChannel(String id, Channel channelDetails, String userId) {
    /**
     * Updates the name of an existing channel if the user has admin privileges.
     *
     * @param id the unique identifier of the channel to be updated (type: {@link String}).
     * @param channelDetails the object containing updated channel details (type: {@link Channel}).
     * @param userId the unique identifier of the user attempting the update (type: {@link String}).
     *     <p>Retrieves the channel by ID and validates if the user has admin privileges. Updates
     *     the channel name and saves the changes to the database.
     * @return the updated channel object after persistence (type: {@link Channel}).
     */
    Channel channel = getChannelById(id);

    userService.validateAdminRole(userId, channel.getId());
    channel.setName(channelDetails.getName());

    return channelRepository.save(channel);
  }

  public void deleteChannel(String id, String userId) {
    /**
     * Deletes a channel if the user has admin privileges.
     *
     * @param id the unique identifier of the channel to be deleted (type: {@link String}).
     * @param userId the unique identifier of the user attempting the deletion (type: {@link
     *     String}).
     *     <p>Retrieves the channel by ID and validates if the user has admin privileges. Removes
     *     the channel from all associated users' channel lists before deletion. Deletes the channel
     *     from the database.
     * @return void (no return value).
     */
    Channel channel = getChannelById(id);
    userService.validateAdminRole(userId, channel.getId());

    // Remove channel from all users' channels list
    for (String memberId : channel.getMembers()) {
      userService.removeChannelFromUser(memberId, id);
    }

    channelRepository.delete(channel);
  }

  public Channel addUserToChannel(String channelId, String userId) {
    /**
     * Adds a user to a specified channel.
     *
     * @param channelId the unique identifier of the channel to which the user will be added (type:
     *     {@link String}).
     * @param userId the unique identifier of the user to be added to the channel (type: {@link
     *     String}).
     *     <p>Retrieves the channel by ID and adds the user to its members list. Updates the channel
     *     in the database and associates the channel with the user. Saves the updated user data.
     * @return the updated {@link Channel} object after adding the user.
     */
    Channel channel = getChannelById(channelId);
    channel.getMembers().add(userId);

    Channel updatedChannel = channelRepository.save(channel);

    // Find the user
    User user = userService.getUserById(userId);

    // Add the channel to the user's list of channels
    user.getChannelIds().add(channelId);

    userService.saveUser(user);

    return updatedChannel;
  }

  public Channel removeUserFromChannel(String channelId, String userId, String requesterId) {
    /**
     * Removes a user from a specified channel.
     *
     * @param channelId the unique identifier of the channel from which the user will be removed
     *     (type: {@link String}).
     * @param userId the unique identifier of the user to be removed from the channel (type: {@link
     *     String}).
     * @param requesterId the unique identifier of the user making the removal request (type: {@link
     *     String}).
     *     <p>Ensures that only an admin or the user themselves can remove a user from a channel.
     *     Retrieves the channel by ID and removes the user from its members list. Updates the
     *     channel in the database and removes the channel association from the user.
     * @return the updated {@link Channel} object after removing the user.
     * @throws UnauthorizedException if the requester does not have permission to remove the user.
     */

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

  public Channel getOrCreateDirectMessageChannel(String userId, String receiverId) {
    /**
     * Retrieves an existing direct message (DM) channel between two users or creates a new one if
     * none exists.
     *
     * @param userId the unique identifier of the first user (type: {@link String}).
     * @param receiverId the unique identifier of the second user (type: {@link String}).
     *     <p>Checks if a DM channel already exists between the two users. If found, returns the
     *     existing channel; otherwise, creates a new DM channel. Adds the new channel to both
     *     users' channel lists and establishes a direct message relationship.
     * @return the existing or newly created {@link Channel} object representing the direct message
     *     channel.
     */

    // Check if users exist
    User user1 = userService.getUserById(userId);
    User user2 = userService.getUserById(receiverId);

    // Try to find existing DM channel
    List<Channel> user1Channels = channelRepository.findIfMemberIsInDirectMessage(userId);

    for (Channel channel : user1Channels) {
      if (channel.getDirectMessageMembers().contains(receiverId)) {
        return channel;
      }
    }

    // Create new DM channel if not exists
    Channel dmChannel = new Channel();
    dmChannel.setName("DM: " + user1.getUsername() + " & " + user2.getUsername());
    dmChannel.setDirectMessage(true);

    Set<String> participants = new HashSet<>();
    participants.add(userId);
    participants.add(receiverId);
    dmChannel.setDirectMessageMembers(participants);
    dmChannel.setMembers(participants);

    String token = generateInviteCode();
    dmChannel.setInviteCode(token);
    dmChannel.setChannelType(ChannelType.DIRECT);

    Channel savedChannel = channelRepository.save(dmChannel);

    // Add to users' direct message lists
    userService.addDirectMessageToUser(userId, receiverId);
    userService.addDirectMessageToUser(receiverId, userId);

    // Add direct message channel to list of channels for each user
    userService.addChannelToUser(userId, savedChannel.getId());
    userService.addChannelToUser(receiverId, savedChannel.getId());

    return savedChannel;
  }

  public List<Channel> getUserChannels(String userId) {
    User user = userService.getUserById(userId);
    return channelRepository.findAllById(user.getChannelIds());
  }

  public List<Channel> getUserDirectMessages(String userId) {
    /**
     * Retrieves a list of direct message (DM) channels for a specified user.
     *
     * @param userId the unique identifier of the user whose direct message channels are being
     *     retrieved (type: {@link String}).
     *     <p>Fetches the user by ID to ensure they exist. Queries the database for direct message
     *     channels in which the user is a participant. Logs a message if no direct message channels
     *     are found for the user.
     * @return a {@link List} of {@link Channel} objects representing the user's direct message
     *     channels.
     * @throws ResourceNotFoundException if the user does not exist.
     */
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
