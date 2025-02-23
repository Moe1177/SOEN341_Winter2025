package com.example.soen341_backend.config;

import com.example.soen341_backend.security.JwtUtils;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.http.server.ServletServerHttpRequest;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.server.HandshakeInterceptor;

@Component
@RequiredArgsConstructor
public class WebSocketAuthenticationInterceptor implements HandshakeInterceptor {

  private JwtUtils jwtUtils; // Your existing JWT utility

  @Override
  public boolean beforeHandshake(
      ServerHttpRequest request,
      ServerHttpResponse response,
      WebSocketHandler wsHandler,
      Map<String, Object> attributes)
      throws Exception {
    // Get token from request parameters
    String token = extractToken(request);

    if (token == null || !jwtUtils.validateToken(token)) {
      return false; // Reject connection if token is invalid
    }

    // Extract user details from token
    String username = jwtUtils.extractUsername(token);
    // Store in attributes for use during connection
    attributes.put("username", username);

    return true;
  }

  private String extractToken(ServerHttpRequest request) {
    if (request instanceof ServletServerHttpRequest servletRequest) {
      String token = servletRequest.getServletRequest().getParameter("token");
      return token != null ? token.replace("Bearer ", "") : null;
    }
    return null;
  }

  @Override
  public void afterHandshake(
      ServerHttpRequest request,
      ServerHttpResponse response,
      WebSocketHandler wsHandler,
      Exception exception) {
    // Nothing to do after handshake
  }
}
