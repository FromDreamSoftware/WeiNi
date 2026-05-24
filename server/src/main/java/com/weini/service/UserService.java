package com.weini.service;

import com.weini.entity.User;
import com.weini.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
@Transactional(readOnly = true)
public class UserService {

  private static final Logger log = LoggerFactory.getLogger(UserService.class);

  private final UserRepository userRepository;

  public UserService(UserRepository userRepository) {
    this.userRepository = userRepository;
  }

  public Optional<User> findById(Long id) {
    return userRepository.findById(id);
  }

  public Optional<User> findByUsername(String username) {
    return userRepository.findByUsername(username);
  }

  public boolean existsByUsername(String username) {
    return userRepository.existsByUsername(username);
  }

  @Transactional
  public User updateProfile(Long userId, String nickname, String email, String avatarUrl) {
    User user = userRepository.findById(userId)
        .orElseThrow(() -> new IllegalArgumentException("用户不存在"));
    if (nickname != null && !nickname.isBlank()) user.setNickname(nickname);
    if (email != null) user.setEmail(email.isBlank() ? null : email);
    if (avatarUrl != null) user.setAvatarUrl(avatarUrl);
    log.info("profile_updated userId={}", userId);
    return user;
  }
}
