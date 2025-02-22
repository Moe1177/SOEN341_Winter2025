package com.example.soen341_backend.user;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class UserService {

  private final UserRepository repository;

  public void saveUser(User user) {
    user.setStatus(Status.ONLINE);
    repository.save(user);
  }

  public User registerUser(String username, String email, String hashedPassword) {
    User user =
        User.builder()
            .username(username)
            .email(email)
            .password(hashedPassword)
            .status(Status.ONLINE)
            .channelIds(List.of()) // Empty list at the start
            .createdAt(Instant.now())
            .build();

    repository.save(user);

    return user;
  }

  public void updateOnlineStatus(String userId, boolean isOnline) {
    repository
        .findById(userId)
        .ifPresent(
            user -> {
              user.setStatus(Status.ONLINE);
              repository.save(user);
            });
  }

  public void joinChannel(String userId, String channelId) {
    repository
        .findById(userId)
        .ifPresent(
            user -> {
              if (!user.getChannelIds().contains(channelId)) {
                user.getChannelIds().add(channelId);
                repository.save(user);
              }
            });
  }

  public void disconnect(User user) {
    var storedUser = repository.findById(user.getId()).orElse(null);

    if (storedUser != null) {
      storedUser.setStatus(Status.OFFLINE);
      repository.save(storedUser);
    }
  }

  public List<User> findConnectedUsers() {
    return repository.findAllByStatus(Status.ONLINE);
  }

  public Optional<User> getUserById(String id) {
    return repository.findById(id);
  }
}
