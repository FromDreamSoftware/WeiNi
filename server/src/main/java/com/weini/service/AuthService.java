package com.weini.service;

import com.weini.dto.LoginRequest;
import com.weini.dto.LoginResponse;
import com.weini.dto.MeResponse;
import com.weini.entity.User;
import com.weini.exception.AuthException;
import com.weini.security.JwtTokenProvider;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class AuthService {

  private static final Logger log = LoggerFactory.getLogger(AuthService.class);

  private final UserService userService;
  private final PasswordEncoder passwordEncoder;
  private final JwtTokenProvider jwtTokenProvider;

  public AuthService(UserService userService, PasswordEncoder passwordEncoder, JwtTokenProvider jwtTokenProvider) {
    this.userService = userService;
    this.passwordEncoder = passwordEncoder;
    this.jwtTokenProvider = jwtTokenProvider;
  }

  public LoginResponse login(LoginRequest request) {
    User user = userService.findByUsername(request.username())
        .orElseThrow(() -> new AuthException("用户名或密码错误"));

    if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
      log.warn("login_failed username={} reason=bad_password", request.username());
      throw new AuthException("用户名或密码错误");
    }

    String accessToken = jwtTokenProvider.generateAccessToken(user);
    String refreshToken = jwtTokenProvider.generateRefreshToken(user);

    log.info("login_ok username={} userId={}", user.getUsername(), user.getId());

    return new LoginResponse(
        accessToken,
        refreshToken,
        user.getId(),
        user.getUsername(),
        user.getNickname(),
        user.getRole().name(),
        user.getAvatarUrl(),
        user.getEmail()
    );
  }

  public java.util.Optional<java.util.Map<String, String>> refresh(String refreshToken) {
    try {
      var claims = jwtTokenProvider.parseToken(refreshToken);
      if (!"refresh".equals(claims.get("type"))) return java.util.Optional.empty();
      User user = userService.findById(Long.parseLong(claims.getSubject())).orElse(null);
      if (user == null) return java.util.Optional.empty();
      String newAccessToken = jwtTokenProvider.generateAccessToken(user);
      return java.util.Optional.of(java.util.Map.of("accessToken", newAccessToken));
    } catch (Exception e) {
      log.warn("refresh_token_invalid message={}", e.getMessage());
      return java.util.Optional.empty();
    }
  }

  public MeResponse me(User user) {
    return new MeResponse(
        user.getId(),
        user.getUsername(),
        user.getNickname(),
        user.getRole().name(),
        user.getAvatarUrl(),
        user.getEmail()
    );
  }
}
