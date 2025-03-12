package com.example.soen341_backend.user;

import com.example.soen341_backend.channel.ChannelRepository;
import com.example.soen341_backend.exceptions.ResourceNotFoundException;
import com.example.soen341_backend.exceptions.UnauthorizedException;
import java.util.List;
import java.util.Optional;
import lombok.AllArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@AllArgsConstructor
public class UserService {

  private final UserRepository userRepository;
  private final ChannelRepository channelRepository;
  private final PasswordEncoder passwordEncoder;

  public void saveUser(User user) {
    user.setStatus(Status.ONLINE);
    userRepository.save(user);
  }

  public List<User> getAllUsers() {
    return userRepository.findAll();
  }

  public User getUserById(String id) {
    return userRepository
        .findById(id)
        .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));
  }

  public User getUserByUsername(String username) {
    return userRepository
        .findByUsername(username)
        .orElseThrow(
            () -> new ResourceNotFoundException("User not found with username: " + username));
  }

  public User updateUser(String id, User userDetails) {
    User user = getUserById(id);

    user.setUsername(userDetails.getUsername());
    user.setEmail(userDetails.getEmail());

    if (userDetails.getPassword() != null && !userDetails.getPassword().isEmpty()) {
      user.setPassword(passwordEncoder.encode(userDetails.getPassword()));
    }

    return userRepository.save(user);
  }

  public void deleteUser(String userId) {
    userRepository.deleteById(userId);
  }

  public void addChannelToUser(String userId, String channelId) {
    User user = getUserById(userId);

    user.getChannelIds().add(channelId);

    userRepository.save(user);
  }

  public void addAdminChannelToUser(String userId, String channelId) {
    User user = getUserById(userId);

    user.getAdminsForWhichChannels().add(channelId);

    userRepository.save(user);
  }

  public boolean isAdmin(String userId, String channelId) {
    User user = getUserById(userId);

    return user.getAdminsForWhichChannels().contains(channelId);
  }

  public void validateAdminRole(String userId, String channelId) {
    if (!isAdmin(userId, channelId)) {
      throw new UnauthorizedException("You don't have permission to perform this action");
    }
  }

  public User removeChannelFromUser(String userId, String channelId) {
    User user = getUserById(userId);

    user.getChannelIds().remove(channelId);

    return userRepository.save(user);
  }

  public User addDirectMessageToUser(String userId, String targetUserId) {
    User user = getUserById(userId);

    user.getDirectMessageIds().add(targetUserId);

    return userRepository.save(user);
  }

  public boolean authenticateUser(String username, String password) {
    Optional<User> user = userRepository.findByUsername(username);

    if (user.isPresent()) {
      return passwordEncoder.matches(password, user.get().getPassword());
    }

    return false;
  }

  public void updateOnlineStatus(String userId, Status status) {
    userRepository
        .findById(userId)
        .ifPresent(
            user -> {
              user.setStatus(status);
              userRepository.save(user);
            });
  }

  public List<User> findConnectedUsers() {
    return userRepository.findAllByStatus(Status.ONLINE);
  }
}
