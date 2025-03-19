package com.example.soen341_backend.message;

import com.example.soen341_backend.security.JwtUtils;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@Slf4j
@RestController
@RequestMapping(value = "/api/messages", produces = MediaType.APPLICATION_JSON_VALUE)
@AllArgsConstructor
@CrossOrigin
public class MessageController {

  private final MessageService messageService;
  private final JwtUtils jwtUtils;
  private final FileStorageService fileStorageService;
  private final AttachmentRepository attachmentRepository;

  @GetMapping("/{id}")
  public Message getMessageById(@PathVariable String id) {
    Message message = messageService.getMessageById(id);

    // Fetch attachments for this message
    List<Attachment> attachments = attachmentRepository.findByMessageId(message.getId());
    message.setAttachments(attachments);

    return message;
  }

  @GetMapping("/channel/{channelId}")
  public List<Message> getChannelMessages(
      @PathVariable String channelId, HttpServletRequest request) {
    // Extract userId from JWT token
    String username = getUserUsernameFromRequest(request);
    List<Message> messages = messageService.getChannelMessages(channelId, username);

    // Fetch attachments for each message
    for (Message message : messages) {
      List<Attachment> attachments = attachmentRepository.findByMessageId(message.getId());
      message.setAttachments(attachments);
    }

    return messages;
  }

  @GetMapping("/direct-messages")
  public List<Message> getDirectMessages(
      @RequestParam String otherUserId, HttpServletRequest request) {
    // Extract userId from JWT token
    String username = getUserUsernameFromRequest(request);
    List<Message> messages = messageService.getDirectMessages(username, otherUserId);

    // Fetch attachments for each message
    for (Message message : messages) {
      List<Attachment> attachments = attachmentRepository.findByMessageId(message.getId());
      message.setAttachments(attachments);
    }

    return messages;
  }

  @PostMapping(value = "/channel", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
  public Message sendChannelMessage(
      @RequestParam(value = "content", required = false) String content,
      @RequestParam("channelId") String channelId,
      @RequestParam(value = "files", required = false) MultipartFile[] files,
      HttpServletRequest request) {

    try {
      log.info(
          "Received channel message request - Channel: {}, Content length: {}, Files: {}",
          channelId,
          content != null ? content.length() : 0,
          files != null ? files.length : 0);

      // Extract username from JWT token
      String username = getUserUsernameFromRequest(request);
      log.info("Message sender: {}", username);

      // Create and save message
      Message message =
          Message.builder()
              .content(content != null ? content : "")
              .channelId(channelId)
              .isDirectMessage(false)
              .build();

      Message savedMessage = messageService.sendMessageWithAttachments(message, username, files);
      log.info("Successfully saved channel message with ID: {}", savedMessage.getId());

      return savedMessage;
    } catch (Exception e) {
      log.error("Failed to send channel message", e);
      throw e;
    }
  }

  @PostMapping(value = "/dm", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
  public Message sendDirectMessage(
      @RequestParam(value = "content", required = false) String content,
      @RequestParam("recipientId") String recipientId,
      @RequestParam(value = "files", required = false) MultipartFile[] files,
      HttpServletRequest request) {

    try {
      log.info(
          "Received direct message request - Recipient: {}, Content length: {}, Files: {}",
          recipientId,
          content != null ? content.length() : 0,
          files != null ? files.length : 0);

      // Extract senderId from JWT token
      String senderUsername = getUserUsernameFromRequest(request);
      log.info("Message sender: {}", senderUsername);

      // Create message
      Message message =
          Message.builder()
              .content(content != null ? content : "")
              .isDirectMessage(true)
              .receiverId(recipientId)
              .build();

      Message savedMessage =
          messageService.sendDirectMessageWithAttachments(
              message, senderUsername, recipientId, files);
      log.info("Successfully saved direct message with ID: {}", savedMessage.getId());

      return savedMessage;
    } catch (Exception e) {
      log.error("Failed to send direct message", e);
      throw e;
    }
  }

  @DeleteMapping("/{id}")
  public ResponseEntity<?> deleteMessage(@PathVariable String id, HttpServletRequest request) {
    // Extract userId from JWT token
    String username = getUserUsernameFromRequest(request);
    messageService.deleteMessage(id, username);
    return ResponseEntity.ok().build();
  }

  @PostMapping("/{id}")
  public ResponseEntity<?> editMessage(
      @PathVariable String id, @RequestBody Message newMessage, HttpServletRequest request) {
    // Extract userId from JWT token
    String username = getUserUsernameFromRequest(request);
    messageService.editMessage(id, username, newMessage);
    return ResponseEntity.ok().build();
  }

  @GetMapping("/attachments/{fileName:.+}")
  public ResponseEntity<Resource> downloadAttachment(@PathVariable String fileName) {
    Resource resource = fileStorageService.loadFileAsResource(fileName);

    // Find the attachment to get the original file name and content type
    String originalFileName = fileName;
    String contentType = "application/octet-stream";

    List<Attachment> attachments = attachmentRepository.findAll();
    for (Attachment attachment : attachments) {
      if (attachment.getFileName().equals(fileName)) {
        originalFileName = attachment.getOriginalFileName();
        contentType = attachment.getContentType();
        break;
      }
    }

    return ResponseEntity.ok()
        .contentType(MediaType.parseMediaType(contentType))
        .header(
            HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + originalFileName + "\"")
        .body(resource);
  }

  // Helper method to extract the username from JWT token in the request
  private String getUserUsernameFromRequest(HttpServletRequest request) {
    log.info("Checking for JWT token in request");

    // First try to get the token from cookies
    Cookie[] cookies = request.getCookies();
    if (cookies != null) {
      log.info("Found {} cookies in request", cookies.length);
      for (Cookie cookie : cookies) {
        log.info(
            "Cookie: {} = {}",
            cookie.getName(),
            cookie.getValue() != null ? "[value present]" : "[no value]");
        if ("jwt".equals(cookie.getName())) {
          log.info("Found JWT cookie");
          return jwtUtils.extractUsername(cookie.getValue());
        }
      }
    } else {
      log.info("No cookies found in request");
    }

    // Fall back to the Authorization header
    String bearerToken = request.getHeader("Authorization");
    log.info("Authorization header: {}", bearerToken != null ? "[present]" : "[not present]");

    if (bearerToken != null && bearerToken.startsWith("Bearer ")) {
      String token = bearerToken.substring(7);
      log.info("Extracted token from Authorization header");
      return jwtUtils.extractUsername(token);
    }

    // Log all headers for debugging
    log.error("JWT token not found in request. Available headers:");
    request
        .getHeaderNames()
        .asIterator()
        .forEachRemaining(
            headerName -> log.error("Header: {} = {}", headerName, request.getHeader(headerName)));

    throw new IllegalStateException("No JWT token found in request");
  }
}
