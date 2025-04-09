package com.example.soen341_backend;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.example.soen341_backend.channel.Channel;
import com.example.soen341_backend.channel.ChannelController;
import com.example.soen341_backend.channel.ChannelService;
import com.example.soen341_backend.security.JwtUtils;
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

@WebMvcTest(ChannelController.class)
@Import(TestSecurityConfig.class)
public class ChannelControllerTest {

  @Autowired private MockMvc mockMvc;
  @MockitoBean private ChannelService channelService;
  @MockitoBean private JwtUtils jwtUtils;
  @Autowired private ObjectMapper objectMapper;

  private Channel sampleChannel;

  @BeforeEach
  void setUp() {
    sampleChannel = new Channel();
    sampleChannel.setId("1");
    sampleChannel.setName("General");
  }

  @Test
  void testGetAllChannels() throws Exception {
    Mockito.when(channelService.getAllChannels()).thenReturn(List.of(sampleChannel));

    mockMvc
        .perform(get("/api/channels"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$[0].name").value("General"));
  }

  @Test
  void testGetChannelById() throws Exception {
    Mockito.when(channelService.getChannelById("1")).thenReturn(sampleChannel);

    mockMvc
        .perform(get("/api/channels/1"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.name").value("General"));
  }

  @Test
  void testCreateChannel() throws Exception {
    Mockito.when(channelService.createChannel(any(Channel.class), eq("123")))
        .thenReturn(sampleChannel);

    mockMvc
        .perform(
            post("/api/channels/create-channel")
                .param("userId", "123")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(sampleChannel)))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.name").value("General"));
  }

  @Test
  void testUpdateChannel() throws Exception {
    Mockito.when(channelService.updateChannel(eq("1"), any(Channel.class), eq("123")))
        .thenReturn(sampleChannel);

    mockMvc
        .perform(
            put("/api/channels/1")
                .param("userId", "123")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(sampleChannel)))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.name").value("General"));
  }

  @Test
  void testDeleteChannel() throws Exception {
    mockMvc.perform(delete("/api/channels/1").param("userId", "123")).andExpect(status().isOk());
  }

  @Test
  void testAddUserToChannel() throws Exception {
    Mockito.when(channelService.addUserToChannel("1", "123")).thenReturn(sampleChannel);

    mockMvc
        .perform(post("/api/channels/1/users/123"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.name").value("General"));
  }

  @Test
  void testJoinChannel() throws Exception {
    Mockito.when(channelService.joinChannelByInviteCode("abc123", "123")).thenReturn(sampleChannel);

    mockMvc
        .perform(put("/api/channels/join").param("inviteCode", "abc123").param("userId", "123"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.name").value("General"));
  }
}
