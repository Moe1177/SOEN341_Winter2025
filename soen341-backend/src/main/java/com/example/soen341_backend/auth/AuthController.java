package com.example.soen341_backend.auth;

import com.example.soen341_backend.security.EmailService;
import com.example.soen341_backend.security.JwtUtils;
import com.example.soen341_backend.user.Status;
import com.example.soen341_backend.user.User;
import com.example.soen341_backend.user.UserRepository;
import java.time.Instant;
import java.util.Optional;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/auth")
public class AuthController {

  private final AuthenticationManager authenticationManager;
  private final JwtUtils jwtUtils;
  private final UserRepository userRepository;
  private final PasswordEncoder passwordEncoder;
  private final EmailService emailService;
  private final int RANDOM_FACTOR = 900000;
  private final int RANDOM_THRESHOLD = 100000;
  private final int VERIFICATION_EXPIRATION = 600; // 10-minute expiration

  /**
   * Handles the login request by authenticating the user's credentials and generating a JWT token
   * if the authentication is successful. The method checks if the provided username and password
   * match the records in the database and whether the user's email is verified. If authentication
   * succeeds, a JWT token is generated and returned. If authentication fails or the email is not
   * verified, an appropriate error response is returned.
   *
   * @param username The username of the user attempting to log in.
   * @param password The password provided by the user for authentication.
   * @return A {@link ResponseEntity} containing the JWT token on successful login, or an error
   *     message with the corresponding HTTP status.
   */
  @PostMapping("/login")
  public ResponseEntity<?> login(@RequestParam String username, @RequestParam String password) {
    try {
      // Attempt to authenticate the user
      authenticationManager.authenticate(
          new UsernamePasswordAuthenticationToken(username, password));

      // Check if the user exists in the repository
      Optional<User> user = userRepository.findByUsername(username);
      if (user.isEmpty()) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
      }

      // Check if the user's email is verified
      if (!user.get().isVerified()) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
            .body("Please verify your email before logging in.");
      }

      // Generate JWT token if authentication is successful
      String token = jwtUtils.generateToken(username);
      return ResponseEntity.ok(new AuthResponse(token));

    } catch (AuthenticationException e) {
      // Return an error response if authentication fails
      return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid credentials");
    }
  }

  /**
   * Registers a new user by validating the uniqueness of the provided username and email, creating
   * a new user record in the database, and sending a verification code to the user's email. The
   * method checks if the username or email already exists in the system and returns an appropriate
   * error response if they do. A random verification code is generated and sent via email, with an
   * expiration time of 10 minutes. The user is initially marked as unverified.
   *
   * @param username The desired username for the new user.
   * @param email The desired email for the new user.
   * @param password The password for the new user.
   * @return A {@link ResponseEntity} indicating the result of the registration process. If
   *     successful, a status of {@code CREATED} is returned with a message prompting the user to
   *     check their email. If the username or email already exists, a {@code CONFLICT} status is
   *     returned with an error message.
   */
  @PostMapping("/register")
  public ResponseEntity<?> register(
      @RequestParam String username, @RequestParam String email, @RequestParam String password) {

    // Check if the username or email already exists in the database
    if (userRepository.findByUsername(username).isPresent()
        || userRepository.findByEmail(email).isPresent()) {
      return ResponseEntity.status(HttpStatus.CONFLICT).body("Username or email already exists");
    }

    // Create a new user
    User user = new User();
    user.setUsername(username);
    user.setEmail(email);
    user.setPassword(passwordEncoder.encode(password)); // Password encryption
    user.setStatus(Status.ONLINE);
    user.setChannelIds(Set.of());
    user.setCreatedAt(Instant.now());
    user.setLastActiveAt(Instant.now());

    // Generate a random verification code and set its expiration
    int verificationCode =
        (int) (Math.random() * RANDOM_FACTOR) + RANDOM_THRESHOLD; // 6-digit random code
    user.setVerificationCode(String.valueOf(verificationCode));
    user.setVerificationCodeExpiration(Instant.now().plusSeconds(VERIFICATION_EXPIRATION));
    user.setVerified(false); // Initially unverified

    // Save the new user to the database
    userRepository.save(user);

    // Send the verification code to the user's email
    emailService.sendEmail(
        user.getEmail(),
        "Email Verification Code",
        "Your verification code is: " + verificationCode + ". It will expire in 10 minutes.");

    // Return success response
    return ResponseEntity.status(HttpStatus.CREATED)
        .body("User registered successfully. Please check your email for the verification code.");
  }

  /**
   * Verifies the provided email verification code for a given user. The method checks if the user
   * exists, if the user is already verified, and whether the provided verification code matches the
   * one stored in the database. It also checks if the verification code has expired. If valid, the
   * user's email is marked as verified and the verification code is cleared. If any condition
   * fails, an appropriate error response is returned.
   *
   * @param username The username of the user attempting to verify their email.
   * @param code The verification code provided by the user.
   * @return A {@link ResponseEntity} indicating the result of the verification process. If the
   *     verification is successful, a {@code OK} status is returned with a success message. If the
   *     user is not found, the code is invalid, or it has expired, an error response with the
   *     appropriate status is returned.
   */
  @PostMapping("/verify-code")
  public ResponseEntity<?> verifyCode(@RequestParam String username, @RequestParam String code) {
    // Retrieve user by username
    Optional<User> userOptional = userRepository.findByUsername(username);
    if (userOptional.isEmpty()) {
      return ResponseEntity.status(HttpStatus.NOT_FOUND).body("User not found");
    }

    User user = userOptional.get();

    // Check if the user is already verified
    if (user.isVerified()) {
      return ResponseEntity.badRequest().body("User is already verified.");
    }

    // Check if the code matches and is not expired
    if (user.getVerificationCode().equals(code)) {
      if (Instant.now().isAfter(user.getVerificationCodeExpiration())) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
            .body("Verification code has expired. Please request a new code.");
      }

      // Mark the user as verified and clear the verification details
      user.setVerified(true);
      user.setVerificationCode("0"); // Clear the code
      user.setVerificationCodeExpiration(null);
      userRepository.save(user);

      return ResponseEntity.ok("Email verified successfully. You can now log in.");
    } else {
      return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Invalid verification code.");
    }
  }

  /**
   * Resends the email verification code to the user if they are not already verified. The method
   * checks if the user exists, if the user is already verified, and then generates a new
   * verification code with a new expiration time. A new verification code is sent to the user's
   * email.
   *
   * @param username The username of the user who is requesting to resend the verification code.
   * @return A {@link ResponseEntity} indicating the result of the resend request. If the user is
   *     not found, a {@code NOT FOUND} status is returned. If the user is already verified, a
   *     {@code BAD REQUEST} status is returned. If the resend is successful, an {@code OK} status
   *     is returned with a success message.
   */
  @PostMapping("/resend-code")
  public ResponseEntity<?> resendCode(@RequestParam String username) {
    // Retrieve user by username
    Optional<User> userOptional = userRepository.findByUsername(username);
    if (userOptional.isEmpty()) {
      return ResponseEntity.status(HttpStatus.NOT_FOUND).body("User not found");
    }

    User user = userOptional.get();

    // Check if the user is already verified
    if (user.isVerified()) {
      return ResponseEntity.badRequest().body("User is already verified.");
    }

    // Generate a new verification code and set its expiration
    int newCode = (int) (Math.random() * RANDOM_FACTOR) + RANDOM_THRESHOLD; // 6-digit random code
    user.setVerificationCode(String.valueOf(newCode));
    user.setVerificationCodeExpiration(
        Instant.now().plusSeconds(VERIFICATION_EXPIRATION)); // 10 minutes expiration

    // Save the updated user with the new verification code
    userRepository.save(user);

    // Send the new verification code to the user's email
    emailService.sendEmail(
        user.getEmail(),
        "New Email Verification Code",
        "Your new verification code is: " + newCode + ". It will expire in 10 minutes.");

    return ResponseEntity.ok("New verification code sent. Please check your email.");
  }

  public record AuthResponse(String token) {}
}
