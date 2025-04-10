package com.example.soen341_backend;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import com.example.soen341_backend.exceptions.ResourceNotFoundException;
import com.example.soen341_backend.exceptions.UnauthorizedException;
import com.example.soen341_backend.user.Status;
import com.example.soen341_backend.user.User;
import com.example.soen341_backend.user.UserRepository;
import com.example.soen341_backend.user.UserService;
import java.util.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

@ExtendWith(MockitoExtension.class)
public class UserServiceTest {

  @Mock private UserRepository userRepository;

  @Mock private PasswordEncoder passwordEncoder;

  @InjectMocks private UserService userService;

  private User testUser;
  private User anotherUser;

  @BeforeEach
  public void setUp() {
    testUser = new User();
    testUser.setId("user-1");
    testUser.setUsername("testuser");
    testUser.setEmail("test@example.com");
    testUser.setPassword("plainPassword");
    testUser.setChannelIds(new HashSet<>());
    testUser.setAdminsForWhichChannels(new HashSet<>());
    testUser.setDirectMessageIds(new HashSet<>());
    testUser.setStatus(Status.OFFLINE);

    anotherUser = new User();
    anotherUser.setId("user-2");
    anotherUser.setUsername("anotheruser");
    anotherUser.setEmail("another@example.com");
    anotherUser.setPassword("anotherPassword");
    anotherUser.setChannelIds(new HashSet<>());
    anotherUser.setAdminsForWhichChannels(new HashSet<>());
    anotherUser.setDirectMessageIds(new HashSet<>());
    anotherUser.setStatus(Status.OFFLINE);
  }

  @Test
  public void testSaveUser_SetsStatusOnlineAndSavesUser() {
    doAnswer(invocation -> invocation.getArgument(0)).when(userRepository).save(any(User.class));
    userService.saveUser(testUser);
    assertEquals(Status.ONLINE, testUser.getStatus());
    verify(userRepository, times(1)).save(testUser);
  }

  @Test
  public void testGetAllUsers_ReturnsUserList() {
    List<User> users = Arrays.asList(testUser, anotherUser);
    when(userRepository.findAll()).thenReturn(users);
    List<User> result = userService.getAllUsers();
    assertEquals(2, result.size());
  }

  @Test
  public void testGetUserById_UserFound() {
    when(userRepository.findById("user-1")).thenReturn(Optional.of(testUser));
    User result = userService.getUserById("user-1");
    assertNotNull(result);
  }

  @Test
  public void testGetUserById_UserNotFound() {
    when(userRepository.findById("nonexistent")).thenReturn(Optional.empty());
    assertThrows(ResourceNotFoundException.class, () -> userService.getUserById("nonexistent"));
  }

  @Test
  public void testGetUserByUsername_UserFound() {
    when(userRepository.findByUsername("testuser")).thenReturn(Optional.of(testUser));
    User result = userService.getUserByUsername("testuser");
    assertEquals("testuser", result.getUsername());
  }

  @Test
  public void testGetUserByUsername_UserNotFound() {
    when(userRepository.findByUsername("unknown")).thenReturn(Optional.empty());
    assertThrows(ResourceNotFoundException.class, () -> userService.getUserByUsername("unknown"));
  }

  @Test
  public void testUpdateUser_WithPasswordChange() {
    User updatedDetails = new User();
    updatedDetails.setUsername("updatedUser");
    updatedDetails.setEmail("updated@example.com");
    updatedDetails.setPassword("newPassword");

    when(userRepository.findById("user-1")).thenReturn(Optional.of(testUser));
    when(passwordEncoder.encode("newPassword")).thenReturn("encodedPassword");
    when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

    User updatedUser = userService.updateUser("user-1", updatedDetails);

    assertEquals("updatedUser", updatedUser.getUsername());
    assertEquals("encodedPassword", updatedUser.getPassword());
  }

  @Test
  public void testUpdateUser_WithoutPasswordChange() {
    User updatedDetails = new User();
    updatedDetails.setUsername("updatedUser");
    updatedDetails.setEmail("updated@example.com");
    updatedDetails.setPassword("");

    when(userRepository.findById("user-1")).thenReturn(Optional.of(testUser));
    when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

    User updatedUser = userService.updateUser("user-1", updatedDetails);
    assertEquals("plainPassword", updatedUser.getPassword());
  }

  @Test
  public void testDeleteUser() {
    doNothing().when(userRepository).deleteById("user-1");
    userService.deleteUser("user-1");
    verify(userRepository).deleteById("user-1");
  }

  @Test
  public void testAddChannelToUser() {
    when(userRepository.findById("user-1")).thenReturn(Optional.of(testUser));
    when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));
    userService.addChannelToUser("user-1", "channel-123");
    assertTrue(testUser.getChannelIds().contains("channel-123"));
  }

  @Test
  public void testAddAdminChannelToUser() {
    when(userRepository.findById("user-1")).thenReturn(Optional.of(testUser));
    when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));
    userService.addAdminChannelToUser("user-1", "channel-123");
    assertTrue(testUser.getAdminsForWhichChannels().contains("channel-123"));
  }

  @Test
  public void testIsAdmin_ReturnsTrue() {
    testUser.getAdminsForWhichChannels().add("channel-123");
    when(userRepository.findById("user-1")).thenReturn(Optional.of(testUser));
    assertTrue(userService.isAdmin("user-1", "channel-123"));
  }

  @Test
  public void testIsAdmin_ReturnsFalse() {
    when(userRepository.findById("user-1")).thenReturn(Optional.of(testUser));
    assertFalse(userService.isAdmin("user-1", "channel-123"));
  }

  @Test
  public void testValidateAdminRole_ThrowsUnauthorizedWhenNotAdmin() {
    when(userRepository.findById("user-1")).thenReturn(Optional.of(testUser));
    assertThrows(
        UnauthorizedException.class, () -> userService.validateAdminRole("user-1", "channel-123"));
  }

  @Test
  public void testGetUsersWithNoDmWithUser() {
    testUser.getDirectMessageIds().add("user-2");
    when(userRepository.findById("user-1")).thenReturn(Optional.of(testUser));
    when(userRepository.findByVerified(true)).thenReturn(Arrays.asList(testUser, anotherUser));
    List<User> result = userService.getUsersWithNoDmWithUser("user-1");
    assertEquals(0, result.size());
  }

  @Test
  public void testRemoveChannelFromUser() {
    testUser.getChannelIds().add("channel-123");
    when(userRepository.findById("user-1")).thenReturn(Optional.of(testUser));
    when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));
    User updated = userService.removeChannelFromUser("user-1", "channel-123");
    assertFalse(updated.getChannelIds().contains("channel-123"));
  }

  @Test
  public void testAddDirectMessageToUser() {
    when(userRepository.findById("user-1")).thenReturn(Optional.of(testUser));
    when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));
    userService.addDirectMessageToUser("user-1", "user-2");
    assertTrue(testUser.getDirectMessageIds().contains("user-2"));
  }

  @Test
  public void testAuthenticateUser_Success() {
    testUser.setPassword("encodedPassword");
    when(userRepository.findByUsername("testuser")).thenReturn(Optional.of(testUser));
    when(passwordEncoder.matches("plainPassword", "encodedPassword")).thenReturn(true);
    assertTrue(userService.authenticateUser("testuser", "plainPassword"));
  }

  @Test
  public void testAuthenticateUser_Failure() {
    testUser.setPassword("encodedPassword");
    when(userRepository.findByUsername("testuser")).thenReturn(Optional.of(testUser));
    when(passwordEncoder.matches("wrongPassword", "encodedPassword")).thenReturn(false);
    assertFalse(userService.authenticateUser("testuser", "wrongPassword"));
  }

  @Test
  public void testUpdateOnlineStatus() {
    when(userRepository.findById("user-1")).thenReturn(Optional.of(testUser));
    when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));
    userService.updateOnlineStatus("user-1", Status.ONLINE);
    assertEquals(Status.ONLINE, testUser.getStatus());
  }

  @Test
  public void testFindConnectedUsers() {
    when(userRepository.findAllByStatus(Status.ONLINE)).thenReturn(List.of(testUser));
    List<User> result = userService.findConnectedUsers();
    assertEquals(1, result.size());
  }
}
