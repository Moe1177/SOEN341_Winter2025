package com.example.soen341_backend.message;

import com.example.soen341_backend.exceptions.ResourceNotFoundException;
import com.example.soen341_backend.security.JwtUtils;
import jakarta.servlet.http.HttpServletRequest;
import java.io.IOException;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.data.mongodb.gridfs.GridFsResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping(value = "/api/messages", produces = MediaType.APPLICATION_JSON_VALUE)
@AllArgsConstructor
@CrossOrigin
@Slf4j
public class MessageController {

  private final MessageService messageService;
  private final JwtUtils jwtUtils;
  private final FileService fileService;

  @GetMapping("/{id}")
  public Message getMessageById(@PathVariable String id) {
    return messageService.getMessageById(id);
  }

  @GetMapping("/channel/{channelId}")
  public List<Message> getChannelMessages(
      @PathVariable String channelId, HttpServletRequest request) {
    // Extract userId from JWT token
    String username = getUserUsernameFromRequest(request);
    return messageService.getChannelMessages(channelId, username);
  }

  @GetMapping("/direct-messages")
  public List<Message> getDirectMessages(
      @RequestParam String otherUserId, HttpServletRequest request) {
    // Extract userId from JWT token
    String username = getUserUsernameFromRequest(request);
    return messageService.getDirectMessages(username, otherUserId);
  }

  @PostMapping("/channel")
  public Message sendChannelMessage(@RequestBody Message message, HttpServletRequest request) {
    // Extract userId from JWT token
    String username = getUserUsernameFromRequest(request);
    return messageService.sendChannelMessage(message, username);
  }

  @PostMapping("/dm")
  public Message sendDirectMessage(
      @RequestBody Message message, @RequestParam String recipientId, HttpServletRequest request) {
    // Extract senderId from JWT token
    String senderUsername = getUserUsernameFromRequest(request);
    return messageService.sendDirectMessage(message, senderUsername, recipientId);
  }

  @PostMapping(value = "/channel-with-attachment", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
  public ResponseEntity<?> sendChannelMessageWithAttachment(
      @RequestParam("content") String content,
      @RequestParam("channelId") String channelId,
      @RequestParam(value = "files", required = false) MultipartFile[] files,
      HttpServletRequest request) {
    try {
      log.info("Received channel message with attachment request. Content: {}, ChannelId: {}, Files: {}", 
               content, channelId, files != null ? files.length : 0);
      
      // Extract userId from JWT token
      String username = getUserUsernameFromRequest(request);
      Message message = messageService.sendChannelMessageWithAttachments(content, username, channelId, files);
      return ResponseEntity.ok(message);
    } catch (IOException e) {
      log.error("Error processing file upload for channel message", e);
      return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
          .body("Error processing file upload: " + e.getMessage());
    } catch (Exception e) {
      log.error("Unexpected error in sendChannelMessageWithAttachment", e);
      return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
          .body("Unexpected error: " + e.getMessage());
    }
  }

  @PostMapping(value = "/dm-with-attachment", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
  public ResponseEntity<?> sendDirectMessageWithAttachment(
      @RequestParam("content") String content,
      @RequestParam("recipientId") String recipientId,
      @RequestParam(value = "files", required = false) MultipartFile[] files,
      HttpServletRequest request) {
    try {
      log.info("Received DM with attachment request. Content: {}, RecipientId: {}, Files: {}", 
               content, recipientId, files != null ? files.length : 0);
      
      // Extract senderId from JWT token
      String senderUsername = getUserUsernameFromRequest(request);
      Message message = messageService.sendDirectMessageWithAttachments(content, senderUsername, recipientId, files);
      return ResponseEntity.ok(message);
    } catch (IOException e) {
      log.error("Error processing file upload for direct message", e);
      return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
          .body("Error processing file upload: " + e.getMessage());
    } catch (Exception e) {
      log.error("Unexpected error in sendDirectMessageWithAttachment", e);
      return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
          .body("Unexpected error: " + e.getMessage());
    }
  }

  @GetMapping("/files/{fileId}")
  public ResponseEntity<?> getFile(
      @PathVariable String fileId,
      @RequestParam(value = "token", required = false) String tokenParam,
      HttpServletRequest request) {
    try {
      log.info("Retrieving file with ID: {}", fileId);
      
      // Try to get token from query parameter first, then from header
      String token = null;
      if (tokenParam != null && !tokenParam.isEmpty()) {
        token = tokenParam;
        log.info("Using token from query parameter");
      } else {
        String bearerToken = request.getHeader("Authorization");
        if (bearerToken != null && bearerToken.startsWith("Bearer ")) {
          token = bearerToken.substring(7);
          log.info("Using token from Authorization header");
        }
      }
      
      if (token == null) {
        log.warn("No authentication token provided for file access: {}", fileId);
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Authentication token is required to access files");
      }
      
      // Validate token
      String username;
      try {
        username = jwtUtils.extractUsername(token);
        log.info("Valid token for user: {}, accessing file: {}", username, fileId);
      } catch (Exception e) {
        log.error("Invalid token for file access: {}", fileId, e);
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid authentication token. Please log in again.");
      }
      
      // At this point, token is valid
      try {
        GridFsResource file = fileService.getFile(fileId);
        byte[] data = fileService.getFileData(fileId);
        ByteArrayResource resource = new ByteArrayResource(data);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentLength(data.length);
        headers.setContentType(MediaType.parseMediaType(file.getContentType()));
        headers.setContentDispositionFormData("attachment", file.getFilename());
        
        log.info("Successfully retrieved file: {}, size: {} bytes, for user: {}", 
                fileId, data.length, username);

        return ResponseEntity.ok()
            .headers(headers)
            .body(resource);
      } catch (ResourceNotFoundException e) {
        log.error("File not found: {}", fileId);
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body("File not found: " + e.getMessage());
      }
    } catch (IOException e) {
      log.error("Error retrieving file data", e);
      return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
          .body("Error retrieving file: " + e.getMessage());
    } catch (Exception e) {
      log.error("Unexpected error retrieving file", e);
      return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
          .body("Unexpected error retrieving file: " + e.getMessage());
    }
  }

  @DeleteMapping("/{messageId}/with-attachments")
  public ResponseEntity<?> deleteMessageWithAttachments(@PathVariable String messageId, HttpServletRequest request) {
    // Extract userId from JWT token
    String username = getUserUsernameFromRequest(request);
    messageService.deleteMessageAndAttachments(messageId, username);
    return ResponseEntity.ok().build();
  }

  @DeleteMapping("/{messageId}")
  public ResponseEntity<?> deleteMessage(
      @PathVariable String messageId, HttpServletRequest request) {
    // Extract userId from JWT token
    String username = getUserUsernameFromRequest(request);
    messageService.deleteMessage(messageId, username);
    return ResponseEntity.ok().build();
  }

  @PutMapping("/{messageId}")
  public Message editMessage(
      @PathVariable String messageId, @RequestBody Message newMessage, HttpServletRequest request) {
    // Extract userId from JWT token
    String username = getUserUsernameFromRequest(request);
    return messageService.editMessage(messageId, username, newMessage);
  }

  // Helper method to extract the username from JWT token in the request
  private String getUserUsernameFromRequest(HttpServletRequest request) {
    String bearerToken = request.getHeader("Authorization");
    if (bearerToken != null && bearerToken.startsWith("Bearer ")) {
      String token = bearerToken.substring(7);
      return jwtUtils.extractUsername(token);
    }
    throw new IllegalStateException("No JWT token found in request");
  }
}
