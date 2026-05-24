package com.weini.controller;

import com.weini.dto.ChatMessageResponse;
import com.weini.security.UserPrincipal;
import com.weini.service.AiChatService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.List;

@RestController
@RequestMapping("/api/ai")
public class AiChatController {

  private static final Logger log = LoggerFactory.getLogger(AiChatController.class);

  private final AiChatService aiChatService;

  public AiChatController(AiChatService aiChatService) {
    this.aiChatService = aiChatService;
  }

  @GetMapping("/messages")
  public ResponseEntity<List<ChatMessageResponse>> getHistory(
      @AuthenticationPrincipal UserPrincipal principal) {
    return ResponseEntity.ok(
        aiChatService.getHistory(principal.id()).stream()
            .map(ChatMessageResponse::from)
            .toList()
    );
  }

  @GetMapping(value = "/chat", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
  public SseEmitter chat(@RequestParam String message,
                         @AuthenticationPrincipal UserPrincipal principal) {
    log.info("ai_chat_request user={} message={}", principal.id(),
        message.substring(0, Math.min(message.length(), 50)));
    return aiChatService.chat(message, principal.id());
  }
}
