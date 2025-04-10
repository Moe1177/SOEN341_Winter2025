package com.example.soen341_backend;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.example.soen341_backend.message.FileService;
import com.example.soen341_backend.message.Message;
import com.example.soen341_backend.message.MessageController;
import com.example.soen341_backend.message.MessageService;
import com.example.soen341_backend.security.JwtUtils;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(MessageController.class)
@Import(TestSecurityConfig.class)
public class MessageControllerTest {

  @Autowired private MockMvc mockMvc;

  @MockitoBean private MessageService messageService;

  @MockitoBean private JwtUtils jwtUtils;

  @MockitoBean private FileService fileService;

  @Autowired private ObjectMapper objectMapper;

  private Message sampleMessage;

  @BeforeEach
  void setUp() {
    sampleMessage = new Message();
    sampleMessage.setId("1");
    sampleMessage.setContent("Hello world");
  }

  @Test
  void testGetMessageById() throws Exception {
    Mockito.when(messageService.getMessageById("1")).thenReturn(sampleMessage);
    mockMvc
        .perform(get("/api/messages/1"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.content").value("Hello world"));
  }

  @Test
  void testGetChannelMessages() throws Exception {
    Mockito.when(jwtUtils.extractUsername("validToken")).thenReturn("testuser");
    Mockito.when(jwtUtils.validateToken("validToken")).thenReturn(true);
    Mockito.when(messageService.getChannelMessages("123", "testuser"))
        .thenReturn(List.of(sampleMessage));

    mockMvc
        .perform(get("/api/messages/channel/123").header("Authorization", "Bearer validToken"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$[0].content").value("Hello world"));
  }

  @Test
  void testGetDirectMessages() throws Exception {
    Mockito.when(jwtUtils.extractUsername("validToken")).thenReturn("testuser");
    Mockito.when(jwtUtils.validateToken("validToken")).thenReturn(true);
    Mockito.when(messageService.getDirectMessages("testuser", "otherUser"))
        .thenReturn(List.of(sampleMessage));

    mockMvc
        .perform(
            get("/api/messages/direct-messages")
                .param("otherUserId", "otherUser")
                .header("Authorization", "Bearer validToken"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$[0].content").value("Hello world"));
  }

  @Test
  void testSendChannelMessage() throws Exception {
    Mockito.when(jwtUtils.extractUsername("validToken")).thenReturn("testuser");
    Mockito.when(jwtUtils.validateToken("validToken")).thenReturn(true);
    Mockito.when(messageService.sendChannelMessage(any(Message.class), eq("testuser")))
        .thenReturn(sampleMessage);

    mockMvc
        .perform(
            post("/api/messages/channel")
                .contentType(MediaType.APPLICATION_JSON)
                .header("Authorization", "Bearer validToken")
                .content(objectMapper.writeValueAsString(sampleMessage)))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.content").value("Hello world"));
  }

  @Test
  void testSendDirectMessage() throws Exception {
    Mockito.when(jwtUtils.extractUsername("validToken")).thenReturn("testuser");
    Mockito.when(jwtUtils.validateToken("validToken")).thenReturn(true);
    Mockito.when(
            messageService.sendDirectMessage(any(Message.class), eq("testuser"), eq("otherUser")))
        .thenReturn(sampleMessage);

    mockMvc
        .perform(
            post("/api/messages/dm")
                .param("recipientId", "otherUser")
                .header("Authorization", "Bearer validToken")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(sampleMessage)))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.content").value("Hello world"));
  }

  @Test
  void testEditMessage() throws Exception {
    Mockito.when(jwtUtils.extractUsername("validToken")).thenReturn("testuser");
    Mockito.when(jwtUtils.validateToken("validToken")).thenReturn(true);
    Mockito.when(messageService.editMessage(eq("1"), eq("testuser"), any(Message.class)))
        .thenReturn(sampleMessage);

    mockMvc
        .perform(
            put("/api/messages/1")
                .header("Authorization", "Bearer validToken")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(sampleMessage)))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.content").value("Hello world"));
  }

  @Test
  void testDeleteMessage() throws Exception {
    Mockito.when(jwtUtils.extractUsername("validToken")).thenReturn("testuser");
    Mockito.when(jwtUtils.validateToken("validToken")).thenReturn(true);
    mockMvc
        .perform(delete("/api/messages/1").header("Authorization", "Bearer validToken"))
        .andExpect(status().isOk());
  }
}
