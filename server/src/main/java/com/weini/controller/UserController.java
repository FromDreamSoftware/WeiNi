package com.weini.controller;

import com.weini.dto.UpdateProfileRequest;
import com.weini.dto.UserResponse;
import com.weini.entity.Role;
import com.weini.entity.User;
import com.weini.repository.UserRepository;
import com.weini.security.UserPrincipal;
import com.weini.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
public class UserController {

  private final UserRepository userRepository;
  private final UserService userService;

  public UserController(UserRepository userRepository, UserService userService) {
    this.userRepository = userRepository;
    this.userService = userService;
  }

  @GetMapping
  public ResponseEntity<List<UserResponse>> list(
      @RequestParam(required = false) String role,
      @AuthenticationPrincipal UserPrincipal principal) {
    if (role != null) {
      return ResponseEntity.ok(userRepository.findByRole(Role.valueOf(role.toUpperCase()))
          .stream()
          .filter(u -> !u.getId().equals(principal.id()))
          .map(UserResponse::from).toList());
    }
    return ResponseEntity.ok(userRepository.findAll()
        .stream()
        .filter(u -> !u.getId().equals(principal.id()))
        .map(UserResponse::from).toList());
  }

  @PutMapping("/me")
  public ResponseEntity<UserResponse> updateProfile(
      @AuthenticationPrincipal UserPrincipal principal,
      @RequestBody UpdateProfileRequest req) {
    User user = userService.updateProfile(principal.id(), req.nickname(), req.email(), req.avatarUrl());
    return ResponseEntity.ok(UserResponse.from(user));
  }
}
