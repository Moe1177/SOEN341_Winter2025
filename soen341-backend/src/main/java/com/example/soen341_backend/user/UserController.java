package com.example.soen341_backend.user;

import com.example.soen341_backend.security.JwtUtils;
import java.util.List;
import java.util.Map;
import lombok.AllArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@AllArgsConstructor
@RequestMapping("/api/users")
@CrossOrigin
public class UserController {

  private final UserService userService;
  private final JwtUtils jwtUtils;

  @GetMapping
  public List<User> getAllUsers() {
    return userService.getAllUsers();
  }

  @GetMapping("/{id}")
  public User getUserById(@PathVariable String id) {
    return userService.getUserById(id);
  }

  @PutMapping("/{id}")
  public User updateUser(@PathVariable String id, @RequestBody User userDetails) {
    return userService.updateUser(id, userDetails);
  }

  @DeleteMapping("/{id}")
  public ResponseEntity<?> deleteUser(@PathVariable String id) {
    userService.deleteUser(id);
    return ResponseEntity.ok().build();
  }

  @PostMapping("/login")
  public ResponseEntity<?> login(@RequestBody Map<String, String> credentials) {
    String username = credentials.get("username");
    String password = credentials.get("password");

    if (userService.authenticateUser(username, password)) {
      User user = userService.getUserByUsername(username);
      return ResponseEntity.ok(user);
    } else {
      return ResponseEntity.status(401).body("Invalid credentials");
    }
  }

  /**
   * Retrieves the currently authenticated user's information based on the JWT token.
   *
   * @param authHeader The Authorization header containing the JWT token
   * @return The authenticated user's information
   */
  @GetMapping("/currentUser")
  public ResponseEntity<?> getCurrentUser(
      @RequestHeader(value = "Authorization", required = false) String authHeader) {
    // Check if Authorization header is present
    if (authHeader == null || !authHeader.startsWith("Bearer ")) {
      return ResponseEntity.status(401).body("Authentication required");
    }

    String token = authHeader.substring(7); // Remove "Bearer " prefix

    // Validate the token
    if (!jwtUtils.validateToken(token)) {
      return ResponseEntity.status(401).body("Invalid or expired token");
    }

    // Get the username from the token
    String username = jwtUtils.extractUsername(token);

    try {
      // Get the user details
      User user = userService.getUserByUsername(username);
      return ResponseEntity.ok(user);
    } catch (Exception e) {
      return ResponseEntity.status(404).body("User not found");
    }
  }
}
