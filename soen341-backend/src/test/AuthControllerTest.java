package com.example.soen341_backend.auth;

import com.example.soen341_backend.security.EmailService;
import com.example.soen341_backend.security.JwtUtils;
import com.example.soen341_backend.user.Status;
import com.example.soen341_backend.user.User;
import com.example.soen341_backend.user.UserRepository;
import com.example.soen341_backend.user.UserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.*;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.Instant;
import java.util.Optional;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class AuthControllerTest {

    @InjectMocks private AuthController authController;

    @Mock private AuthenticationManager authenticationManager;
    @Mock private JwtUtils jwtUtils;
    @Mock private UserRepository userRepository;
    @Mock private PasswordEncoder passwordEncoder;
    @Mock private EmailService emailService;
    @Mock private UserService userService;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        authController = new AuthController(authenticationManager, jwtUtils, userRepository,
                passwordEncoder, emailService, userService);
    }

    @Test
    void testLogin_Success() {
        String username = "testUser";
        String password = "testPass";
        User user = new User();
        user.setId("userId");
        when(userRepository.findByUsername(username)).thenReturn(Optional.of(user));
        when(jwtUtils.generateToken(username)).thenReturn("mockToken");

        ResponseEntity<?> response = authController.login(username, password);

        assertEquals(200, response.getStatusCodeValue());
        assertTrue(response.getBody().toString().contains("mockToken"));
    }

    @Test
    void testLogin_InvalidCredentials() {
        String username = "testUser";
        String password = "wrongPass";

        doThrow(new BadCredentialsException("Bad credentials"))
                .when(authenticationManager)
                .authenticate(any(UsernamePasswordAuthenticationToken.class));

        ResponseEntity<?> response = authController.login(username, password);

        assertEquals(401, response.getStatusCodeValue());
    }

    @Test
    void testRegister_Success() {
        String username = "newUser";
        String email = "new@user.com";
        String password = "password";

        when(userRepository.findByUsername(username)).thenReturn(Optional.empty());
        when(userRepository.findByEmail(email)).thenReturn(Optional.empty());

        ResponseEntity<?> response = authController.register(username, email, password);

        assertEquals(201, response.getStatusCodeValue());
        verify(emailService).sendEmail(eq(email), anyString(), contains("Your verification code"));
    }

    @Test
    void testRegister_Conflict() {
        when(userRepository.findByUsername("existing")).thenReturn(Optional.of(new User()));

        ResponseEntity<?> response = authController.register("existing", "email", "pass");

        assertEquals(409, response.getStatusCodeValue());
    }

    @Test
    void testVerifyCode_Success() {
        User user = new User();
        user.setVerificationCode("123456");
        user.setVerificationCodeExpiration(Instant.now().plusSeconds(300));
        user.setVerified(false);

        when(userRepository.findByUsername("test")).thenReturn(Optional.of(user));

        ResponseEntity<?> response = authController.verifyCode("test", "123456");

        assertEquals(200, response.getStatusCodeValue());
        assertTrue(user.isVerified());
    }

    @Test
    void testResendCode_Success() {
        User user = new User();
        user.setVerified(false);
        user.setEmail("user@example.com");

        when(userRepository.findByUsername("test")).thenReturn(Optional.of(user));

        ResponseEntity<?> response = authController.resendCode("test");

        assertEquals(200, response.getStatusCodeValue());
        verify(emailService).sendEmail(eq(user.getEmail()), anyString(), contains("Your new verification code"));
    }

    @Test
    void testLogout_Success() {
        String token = "Bearer mock.jwt.token";
        User user = new User();
        user.setUsername("testUser");

        when(jwtUtils.extractUsername("mock.jwt.token")).thenReturn("testUser");
        when(userRepository.findByUsername("testUser")).thenReturn(Optional.of(user));

        ResponseEntity<?> response = authController.logout(token);

        assertEquals(200, response.getStatusCodeValue());
        verify(jwtUtils).blacklistToken("mock.jwt.token");
    }
}
