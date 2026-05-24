package com.weini.security;

import io.jsonwebtoken.Claims;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class WebSocketAuthInterceptor implements ChannelInterceptor {

  private static final Logger log = LoggerFactory.getLogger(WebSocketAuthInterceptor.class);

  private final JwtTokenProvider jwtTokenProvider;

  public WebSocketAuthInterceptor(JwtTokenProvider jwtTokenProvider) {
    this.jwtTokenProvider = jwtTokenProvider;
  }

  @Override
  public Message<?> preSend(Message<?> message, MessageChannel channel) {
    StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);

    if (accessor != null && StompCommand.CONNECT.equals(accessor.getCommand())) {
      String authHeader = accessor.getFirstNativeHeader("Authorization");
      if (authHeader != null && authHeader.startsWith("Bearer ")) {
        String token = authHeader.substring(7);
        if (jwtTokenProvider.validateToken(token)) {
          Claims claims = jwtTokenProvider.parseToken(token);
          Long userId = Long.valueOf(claims.getSubject());
          String role = claims.get("role", String.class);
          String username = claims.get("username", String.class);

          UserPrincipal principal = new UserPrincipal(userId, username, role);
          UsernamePasswordAuthenticationToken auth =
              new UsernamePasswordAuthenticationToken(principal, null,
                  List.of(new SimpleGrantedAuthority("ROLE_" + role)));
          accessor.setUser(auth);
          log.debug("ws_auth_success userId={}", userId);
        }
      }
      if (accessor.getUser() == null) {
        log.debug("ws_auth_failed");
        throw new IllegalArgumentException("Invalid or missing JWT token");
      }
    }
    return message;
  }
}
