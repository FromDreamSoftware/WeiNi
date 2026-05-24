package com.weini.controller;

import com.weini.dto.LoginRequest;
import com.weini.dto.LoginResponse;
import com.weini.dto.MeResponse;
import com.weini.security.UserPrincipal;
import com.weini.service.AuthService;
import com.weini.service.UserService;
import jakarta.validation.Valid;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

  private static final Logger log = LoggerFactory.getLogger(AuthController.class);

  private final AuthService authService;
  private final UserService userService;

  public AuthController(AuthService authService, UserService userService) {
    this.authService = authService;
    this.userService = userService;
  }

  @PostMapping("/login")
  public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest request) {
    LoginResponse response = authService.login(request);
    return ResponseEntity.ok(response);
  }

  @GetMapping("/me")
  public ResponseEntity<MeResponse> me(@AuthenticationPrincipal UserPrincipal principal) {
    if (principal == null) return ResponseEntity.status(401).build();
    return userService.findById(principal.id())
        .map(authService::me)
        .map(ResponseEntity::ok)
        .orElse(ResponseEntity.notFound().build());
  }

  @PostMapping("/refresh")
  public ResponseEntity<?> refresh(@RequestHeader("Authorization") String authHeader) {
    if (authHeader == null || !authHeader.startsWith("Bearer ")) {
      return ResponseEntity.status(401).body(Map.of("error", "Missing token"));
    }
    return authService.refresh(authHeader.substring(7))
        .map(ResponseEntity::ok)
        .orElse(ResponseEntity.status(401).body(Map.of("error", "Invalid refresh token")));
  }
}
