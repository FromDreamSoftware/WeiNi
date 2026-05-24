package com.weini.security;

import com.weini.entity.User;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

@Component
public class JwtTokenProvider {

  private static final Logger log = LoggerFactory.getLogger(JwtTokenProvider.class);

  private final SecretKey key;
  private final long accessExpiration;
  private final long refreshExpiration;

  public JwtTokenProvider(
      @Value("${app.jwt.secret}") String secret,
      @Value("${app.jwt.access-token-expiration}") long accessExpiration,
      @Value("${app.jwt.refresh-token-expiration}") long refreshExpiration) {
    this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
    this.accessExpiration = accessExpiration;
    this.refreshExpiration = refreshExpiration;
  }

  public String generateAccessToken(User user) {
    Date now = new Date();
    return Jwts.builder()
        .subject(user.getId().toString())
        .claim("username", user.getUsername())
        .claim("role", user.getRole().name())
        .issuedAt(now)
        .expiration(new Date(now.getTime() + accessExpiration))
        .signWith(key)
        .compact();
  }

  public String generateRefreshToken(User user) {
    Date now = new Date();
    return Jwts.builder()
        .subject(user.getId().toString())
        .claim("type", "refresh")
        .issuedAt(now)
        .expiration(new Date(now.getTime() + refreshExpiration))
        .signWith(key)
        .compact();
  }

  public Claims parseToken(String token) {
    return Jwts.parser()
        .verifyWith(key)
        .build()
        .parseSignedClaims(token)
        .getPayload();
  }

  public boolean validateToken(String token) {
    try {
      parseToken(token);
      return true;
    } catch (JwtException e) {
      log.debug("jwt_invalid message={}", e.getMessage());
      return false;
    }
  }
}
