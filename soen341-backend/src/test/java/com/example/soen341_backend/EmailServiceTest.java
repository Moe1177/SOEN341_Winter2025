package com.example.soen341_backend;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.example.soen341_backend.auth.AuthController;
import com.example.soen341_backend.security.EmailService;
import com.example.soen341_backend.security.JwtUtils;
import com.example.soen341_backend.user.User;
import com.example.soen341_backend.user.UserRepository;
import com.example.soen341_backend.user.UserService;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders;

@WebMvcTest(AuthController.class)
@Import(TestSecurityConfig.class)
public class EmailServiceTest {

  @Autowired private MockMvc mockMvc;

  // These @MockBean definitions populate the application context for the controller.
  @MockitoBean private AuthenticationManager authenticationManager;

  @MockitoBean private JwtUtils jwtUtils;

  @MockitoBean private UserRepository userRepository;

  @MockitoBean private PasswordEncoder passwordEncoder;

  @MockitoBean private EmailService emailService;

  @MockitoBean private UserService userService;

  @Test
  public void testRegisterCallsEmailService() throws Exception {
    // Prepare the repository to simulate "user not found" so that registration proceeds
    when(userRepository.findByUsername("testuser")).thenReturn(Optional.empty());
    when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.empty());
    when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

    // Execute the registration endpoint (assumed to be "/api/auth/register")
    mockMvc
        .perform(
            MockMvcRequestBuilders.post("/api/auth/register")
                .param("username", "testuser")
                .param("email", "test@example.com")
                .param("password", "password")
                .contentType(MediaType.APPLICATION_FORM_URLENCODED))
        .andExpect(status().isCreated());

    // Verify that emailService.sendEmail was invoked correctly.
    verify(emailService, times(1))
        .sendEmail(eq("test@example.com"), anyString(), contains("verification code"));
  }
}
