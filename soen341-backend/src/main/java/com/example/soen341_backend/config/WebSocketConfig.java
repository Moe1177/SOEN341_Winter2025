package com.example.soen341_backend.config;

import com.example.soen341_backend.security.JwtUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

@Configuration
@EnableWebSocketMessageBroker
@RequiredArgsConstructor
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

  private final JwtUtils jwtUtils;

  @Override
  public void configureMessageBroker(MessageBrokerRegistry registry) {
    registry.enableSimpleBroker("/topic", "/queue");
    registry.setApplicationDestinationPrefixes("/app");
    registry.setUserDestinationPrefix("/user");
  }

  @Override
  public void registerStompEndpoints(StompEndpointRegistry registry) {
    registry.addEndpoint("/ws").setAllowedOrigins("*").withSockJS();
  }

  //  @Override
  //  public boolean configureMessageConverters(List<MessageConverter> messageConverters) {
  //    DefaultContentTypeResolver resolver = new DefaultContentTypeResolver();
  //
  //    resolver.setDefaultMimeType(MimeTypeUtils.APPLICATION_JSON);
  //
  //    MappingJackson2MessageConverter converter = new MappingJackson2MessageConverter();
  //    converter.setObjectMapper(new ObjectMapper());
  //    converter.setContentTypeResolver(resolver);
  //
  //    messageConverters.add(converter);
  //    return false;
  //  }

  //  @Override
  //  public void configureClientInboundChannel(ChannelRegistration registration) {
  //    registration.interceptors(
  //        new ChannelInterceptor() {
  //          @Override
  //          public Message<?> preSend(Message<?> message, MessageChannel channel) {
  //            StompHeaderAccessor accessor =
  //                MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
  //
  //            assert accessor != null;
  //            if (StompCommand.CONNECT.equals(accessor.getCommand())) {
  //              // Extract JWT from the headers during connection
  //              List<String> authorization = accessor.getNativeHeader("Authorization");
  //              if (authorization != null && !authorization.isEmpty()) {
  //                String bearerToken = authorization.get(0);
  //                if (bearerToken != null && bearerToken.startsWith("Bearer ")) {
  //                  String token = bearerToken.substring(7);
  //                  if (jwtUtils.validateToken(token)) {
  //                    String username = jwtUtils.extractUsername(token);
  //                    // Store the username in session attributes to access later
  //                    accessor.setUser(() -> username);
  //                    Objects.requireNonNull(accessor.getSessionAttributes())
  //                        .put("username", username);
  //                  }
  //                }
  //              }
  //            }
  //            return message;
  //          }
  //        });
  //  }
}
