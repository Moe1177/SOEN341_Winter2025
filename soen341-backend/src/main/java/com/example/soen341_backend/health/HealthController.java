package com.example.soen341_backend.health;

import java.time.Instant;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@CrossOrigin(origins = "*")
public class HealthController {

  @GetMapping("/ping")
  public ResponseEntity<String> ping() {
    System.out.println("Ping received at: " + Instant.now().toString());
    return ResponseEntity.ok("OK");
  }
}
