package com.example.soen341_backend;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import com.example.soen341_backend.message.Message;
import com.example.soen341_backend.message.MessageService;
import com.example.soen341_backend.payload.WebSocketMessage;
import com.example.soen341_backend.security.JwtUtils;
import com.example.soen341_backend.user.User;
import com.example.soen341_backend.user.UserRepository;
import java.time.Instant;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.simp.SimpMessagingTemplate;

@ExtendWith(MockitoExtension.class)
public class WebSocketControllerTest {

  @Mock private SimpMessagingTemplate messagingTemplate;

  @Mock private MessageService messageService;

  @Mock private JwtUtils jwtUtils;

  @Mock private UserRepository userRepository;

  @InjectMocks private com.example.soen341_backend.payload.WebSocketController webSocketController;

  private User testUser;

  private static boolean matches(Message m) {
    return m.getSenderId().equals("user-1") && m.getContent().equals("Hello Channel!");
  }

  @BeforeEach
  public void setUp() {
    testUser = new User();
    testUser.setId("user-1");
    testUser.setUsername("testuser");
    // configure any other properties needed by your logic
  }

  // Helper method to create a header accessor with either session attributes or native headers.
  private SimpMessageHeaderAccessor createHeaderAccessorWithUsername() {
    // Create a header accessor and set a session attribute with username
    SimpMessageHeaderAccessor headerAccessor = SimpMessageHeaderAccessor.create();
    Map<String, Object> sessionAttributes = new HashMap<>();
    sessionAttributes.put("username", "testuser");
    headerAccessor.setSessionAttributes(sessionAttributes);
    return headerAccessor;
  }

  @Test
  public void testHandleChannelMessage() {
    // Prepare a WebSocketMessage payload for group/channel messaging.
    WebSocketMessage wsMessage = new WebSocketMessage();
    wsMessage.setContent("Hello Channel!");
    wsMessage.setChannelId("channel-1");
    // Optionally set other properties if used

    // Prepare header accessor with session attributes containing the username.
    SimpMessageHeaderAccessor headerAccessor = createHeaderAccessorWithUsername();

    // Stub user repository to find testUser from username.
    when(userRepository.findByUsername("testuser")).thenReturn(Optional.of(testUser));

    // Optionally stub the messageService call; for example, you can simulate that it returns the
    // message saved.
    // Here we assume sendChannelMessage returns the saved message.
    // We use any(Message.class) since the message is created inside the controller.
    when(messageService.sendChannelMessage(any(Message.class), eq("user-1")))
        .thenAnswer(invocation -> invocation.getArgument(0));

    // Call the controller method for group messages.
    webSocketController.handleChannelMessage(wsMessage, headerAccessor);

    // Verify that the messageService was called with a message having the test user as sender.
    verify(messageService, times(1))
        .sendChannelMessage(argThat(WebSocketControllerTest::matches), eq("user-1"));

    // Verify that the messagingTemplate sends to the proper destination.
    verify(messagingTemplate, times(1))
        .convertAndSend(
            eq("/topic/channel/" + wsMessage.getChannelId()), any(WebSocketMessage.class));
  }

  @Test
  public void testHandleDirectMessage() {
    // Prepare a WebSocketMessage payload for direct messaging.
    WebSocketMessage wsMessage = new WebSocketMessage();
    wsMessage.setContent("Hello Direct!");
    wsMessage.setChannelId("dummy-channel");
    wsMessage.setDirectMessage(true);
    // Set the intended recipient.
    wsMessage.setReceiverId("user-2");

    // Create header accessor with session attribute for username
    SimpMessageHeaderAccessor headerAccessor = createHeaderAccessorWithUsername();

    // Stub user repository call.
    when(userRepository.findByUsername("testuser")).thenReturn(Optional.of(testUser));

    // Simulate that the MessageService returns a Message having an assigned channel id.
    Message directMessage = new Message();
    directMessage.setChannelId("direct-channel-1");
    directMessage.setSenderId("user-1");
    directMessage.setReceiverId("user-2");
    directMessage.setContent("Hello Direct!");
    directMessage.setTimestamp(Instant.now());
    directMessage.setDirectMessage(true);
    when(messageService.sendDirectMessage(any(Message.class), eq("testuser"), eq("user-2")))
        .thenReturn(directMessage);

    // Call the controller method for direct messaging.
    webSocketController.handleDirectMessage(wsMessage, headerAccessor);

    // Verify that the messageService was called correctly.
    verify(messageService, times(1))
        .sendDirectMessage(
            argThat(
                (Message m) ->
                    m.getContent().equals("Hello Direct!")
                        && m.isDirectMessage()
                        && m.getReceiverId().equals("user-2")),
            eq("testuser"),
            eq("user-2"));

    // Verify that messagingTemplate sends the direct message to the correct user.
    verify(messagingTemplate, times(1))
        .convertAndSendToUser(eq("user-2"), eq("/direct-messages"), any(WebSocketMessage.class));
  }

  @Test
  public void testGetUsernameFromHeaders_FallbackToAuthorizationHeader() {
    // Test the extraction when session attribute is missing but native header "Authorization"
    // exists.
    SimpMessageHeaderAccessor headerAccessor = SimpMessageHeaderAccessor.create();
    // No session attributes are added.
    String fakeToken = "fake-jwt-token";
    headerAccessor.setNativeHeader("Authorization", "Bearer " + fakeToken);

    when(jwtUtils.extractUsername(fakeToken)).thenReturn("testuser");

    // Call the private method via reflection (or indirectly by calling one of the public endpoints)
    // Here we call handleChannelMessage and expect it to use the Authorization header extraction.
    WebSocketMessage wsMessage = new WebSocketMessage();
    wsMessage.setContent("Using token!");
    wsMessage.setChannelId("channel-1");

    // Stub the repository lookup for this username.
    when(userRepository.findByUsername("testuser")).thenReturn(Optional.of(testUser));
    when(messageService.sendChannelMessage(any(Message.class), eq("user-1")))
        .thenAnswer(invocation -> invocation.getArgument(0));

    // Execute method that relies on getUsernameFromHeaders.
    webSocketController.handleChannelMessage(wsMessage, headerAccessor);

    // Verify that the jwtUtils.extractUsername was called.
    verify(jwtUtils, times(1)).extractUsername(fakeToken);
  }
}
