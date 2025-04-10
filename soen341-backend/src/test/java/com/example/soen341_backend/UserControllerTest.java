package com.example.soen341_backend;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.example.soen341_backend.security.JwtUtils;
import com.example.soen341_backend.user.User;
import com.example.soen341_backend.user.UserController;
import com.example.soen341_backend.user.UserService;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(UserController.class)
@Import(TestSecurityConfig.class) // ✅ Import security override
public class UserControllerTest {

  @Autowired private MockMvc mockMvc;

  @MockitoBean private UserService userService;

  @MockitoBean private JwtUtils jwtUtils;

  @Autowired private ObjectMapper objectMapper;

  private User sampleUser;

  @BeforeEach
  void setUp() {
    sampleUser = new User();
    sampleUser.setId("1");
    sampleUser.setUsername("testuser");
    sampleUser.setEmail("test@example.com");
  }

  @Test
  void testGetAllUsers() throws Exception {
    List<User> users = List.of(sampleUser);
    Mockito.when(userService.getAllUsers()).thenReturn(users);

    mockMvc
        .perform(get("/api/users"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$[0].username").value("testuser"));
  }

  @Test
  void testGetUserById() throws Exception {
    Mockito.when(userService.getUserById("1")).thenReturn(sampleUser);

    mockMvc
        .perform(get("/api/users/1"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.username").value("testuser"));
  }

  @Test
  void testUpdateUser() throws Exception {
    Mockito.when(userService.updateUser(eq("1"), any(User.class))).thenReturn(sampleUser);

    mockMvc
        .perform(
            put("/api/users/1")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(sampleUser)))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.username").value("testuser"));
  }

  @Test
  void testDeleteUser() throws Exception {
    mockMvc.perform(delete("/api/users/1")).andExpect(status().isOk());
  }

  @Test
  void testLoginSuccess() throws Exception {
    Map<String, String> credentials = Map.of("username", "testuser", "password", "pass123");

    Mockito.when(userService.authenticateUser("testuser", "pass123")).thenReturn(true);
    Mockito.when(userService.getUserByUsername("testuser")).thenReturn(sampleUser);

    mockMvc
        .perform(
            post("/api/users/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(credentials)))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.username").value("testuser"));
  }

  @Test
  void testLoginFailure() throws Exception {
    Map<String, String> credentials = Map.of("username", "wrong", "password", "fail");

    Mockito.when(userService.authenticateUser("wrong", "fail")).thenReturn(false);

    mockMvc
        .perform(
            post("/api/users/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(credentials)))
        .andExpect(status().isUnauthorized())
        .andExpect(content().string("Invalid credentials"));
  }

  @Test
  void testGetCurrentUserSuccess() throws Exception {
    String token = "validToken";

    Mockito.when(jwtUtils.validateToken(token)).thenReturn(true);
    Mockito.when(jwtUtils.extractUsername(token)).thenReturn("testuser");
    Mockito.when(userService.getUserByUsername("testuser")).thenReturn(sampleUser);

    mockMvc
        .perform(get("/api/users/currentUser").header("Authorization", "Bearer " + token))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.username").value("testuser"));
  }

  @Test
  void testGetCurrentUserMissingToken() throws Exception {
    mockMvc
        .perform(get("/api/users/currentUser"))
        .andExpect(status().isUnauthorized())
        .andExpect(content().string("Authentication required"));
  }

  @Test
  void testGetCurrentUserInvalidToken() throws Exception {
    String token = "invalid";

    Mockito.when(jwtUtils.validateToken(token)).thenReturn(false);

    mockMvc
        .perform(get("/api/users/currentUser").header("Authorization", "Bearer " + token))
        .andExpect(status().isUnauthorized())
        .andExpect(content().string("Invalid or expired token"));
  }

  @Test
  void testGetCurrentUserUserNotFound() throws Exception {
    String token = "validToken";

    Mockito.when(jwtUtils.validateToken(token)).thenReturn(true);
    Mockito.when(jwtUtils.extractUsername(token)).thenReturn("nonexistent");
    Mockito.when(userService.getUserByUsername("nonexistent"))
        .thenThrow(new RuntimeException("User not found"));

    mockMvc
        .perform(get("/api/users/currentUser").header("Authorization", "Bearer " + token))
        .andExpect(status().isNotFound())
        .andExpect(content().string("User not found"));
  }
}
