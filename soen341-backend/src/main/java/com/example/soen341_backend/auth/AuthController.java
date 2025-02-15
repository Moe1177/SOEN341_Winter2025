package com.example.soen341_backend.auth;

import com.example.soen341_backend.security.EmailService;
import com.example.soen341_backend.security.JwtUtils;
import com.example.soen341_backend.security.UserDetailsServiceImpl;
import com.example.soen341_backend.user.Status;
import com.example.soen341_backend.user.User;
import com.example.soen341_backend.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final JwtUtils jwtUtils;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestParam String username, @RequestParam String password) {
        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(username, password)
            );

            Optional<User> user = userRepository.findByUsername(username);
            if (user.isEmpty()) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
            }

            // Check if email is verified
            if (!user.get().isVerified()) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Please verify your email before logging in.");
            }

            String token = jwtUtils.generateToken(username);
            return ResponseEntity.ok(new AuthResponse(token));

        } catch (AuthenticationException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid credentials");
        }
    }


    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestParam String username,
                                      @RequestParam String email,
                                      @RequestParam String password) {

        if (userRepository.findByUsername(username).isPresent() || userRepository.findByEmail(email).isPresent()) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body("Username or email already exists");
        }

        User user = new User();
        user.setUsername(username);
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode(password));
        user.setStatus(Status.ONLINE);
        user.setChannelIds(List.of());
        user.setCreatedAt(Instant.now());
        user.setLastActiveAt(Instant.now());

        // Generate code and set expiration
        int verificationCode = (int) (Math.random() * 900000) + 100000;
        user.setVerificationCode(String.valueOf(verificationCode));
        user.setVerificationCodeExpiration(Instant.now().plusSeconds(600)); // 10 min expiration
        user.setVerified(false);

        userRepository.save(user);

        // Send email with the code
        emailService.sendEmail(user.getEmail(), "Email Verification Code",
                "Your verification code is: " + verificationCode + ". It will expire in 10 minutes.");

        return ResponseEntity.status(HttpStatus.CREATED).body("User registered successfully. Please check your email for the verification code.");
    }


    @PostMapping("/verify-code")
    public ResponseEntity<?> verifyCode(@RequestParam String username, @RequestParam String code) {
        Optional<User> userOptional = userRepository.findByUsername(username);
        if (userOptional.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("User not found");
        }

        User user = userOptional.get();
        if (user.isVerified()) {
            return ResponseEntity.badRequest().body("User is already verified.");
        }

        // Check if code matches and is not expired
        if (user.getVerificationCode().equals(code)) {
            if (Instant.now().isAfter(user.getVerificationCodeExpiration())) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Verification code has expired. Please request a new code.");
            }

            // Mark as verified
            user.setVerified(true);
            user.setVerificationCode("0"); // Clear the code
            user.setVerificationCodeExpiration(null);
            userRepository.save(user);

            return ResponseEntity.ok("Email verified successfully. You can now log in.");
        } else {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Invalid verification code.");
        }
    }

    @PostMapping("/resend-code")
    public ResponseEntity<?> resendCode(@RequestParam String username) {
        Optional<User> userOptional = userRepository.findByUsername(username);
        if (userOptional.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("User not found");
        }

        User user = userOptional.get();

        // Check if the user is already verified
        if (user.isVerified()) {
            return ResponseEntity.badRequest().body("User is already verified.");
        }

        // Generate a new code and set a new expiration (e.g., 10 mins)
        int newCode = (int) (Math.random() * 900000) + 100000;
        user.setVerificationCode(String.valueOf(newCode));
        user.setVerificationCodeExpiration(Instant.now().plusSeconds(600)); // 10 minutes

        userRepository.save(user);

        // Send the new verification code
        emailService.sendEmail(user.getEmail(), "New Email Verification Code",
                "Your new verification code is: " + newCode + ". It will expire in 10 minutes.");

        return ResponseEntity.ok("New verification code sent. Please check your email.");
    }


    public record AuthResponse(String token) {}
}
