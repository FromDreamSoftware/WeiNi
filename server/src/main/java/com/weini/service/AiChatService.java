package com.weini.service;

import com.weini.entity.ChatMessage;
import com.weini.entity.User;
import com.weini.repository.ChatMessageRepository;
import com.weini.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.util.List;
import java.util.Map;
import java.util.concurrent.Executor;

@Service
public class AiChatService {

  private static final Logger log = LoggerFactory.getLogger(AiChatService.class);
  private static final ObjectMapper objectMapper = new ObjectMapper();

  private final RestTemplate restTemplate;
  private final String apiKey;
  private final String baseUrl;
  private final String model;
  private final ChatMessageRepository chatMessageRepository;
  private final UserRepository userRepository;
  private final TransactionTemplate transactionTemplate;
  private final Executor chatExecutor;

  private static final String SYSTEM_PROMPT = """
      你是喂你(WeiNi)情侣App中的AI小助手，名字叫"小喂"。
      你是一个可爱、温柔、有点调皮的女孩子形象。
      你的男朋友是个大厨，会做很多好吃的。你的女朋友是个可爱的小吃货。
      你要用温暖、甜蜜的语气和情侣双方聊天，偶尔可以撒娇、卖萌。
      你可以聊恋爱话题、推荐美食、讲冷笑话、给感情建议。
      回复保持简洁（不超过100字），用中文，语气要可爱。
      """;

  public AiChatService(@Value("${app.deepseek.api-key}") String apiKey,
                        @Value("${app.deepseek.base-url}") String baseUrl,
                        @Value("${app.deepseek.model}") String model,
                        ChatMessageRepository chatMessageRepository,
                        UserRepository userRepository,
                        PlatformTransactionManager transactionManager,
                        @org.springframework.beans.factory.annotation.Qualifier("chatExecutor") Executor chatExecutor) {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
    this.model = model;
    this.chatMessageRepository = chatMessageRepository;
    this.userRepository = userRepository;
    this.transactionTemplate = new TransactionTemplate(transactionManager);
    this.chatExecutor = chatExecutor;

    SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
    factory.setBufferRequestBody(false);
    this.restTemplate = new RestTemplate(factory);
  }

  public List<ChatMessage> getHistory(Long userId) {
    return chatMessageRepository.findByUserIdOrderByCreatedAtAsc(userId);
  }

  @Transactional
  public SseEmitter chat(String userMessage, Long userId) {
    User user = userRepository.findById(userId).orElseThrow();
    chatMessageRepository.save(new ChatMessage(user, ChatMessage.Role.USER, userMessage));

    SseEmitter emitter = new SseEmitter(120_000L);

    chatExecutor.execute(() -> {
      StringBuilder fullContent = new StringBuilder();
      try {
        Map<String, Object> requestBody = Map.of(
            "model", model,
            "messages", List.of(
                Map.of("role", "system", "content", SYSTEM_PROMPT),
                Map.of("role", "user", "content", userMessage)
            ),
            "stream", true,
            "temperature", 0.8
        );

        log.info("ai_chat_start user={} msg={}", userId,
            userMessage.substring(0, Math.min(userMessage.length(), 50)));

        restTemplate.execute(baseUrl + "/v1/chat/completions", HttpMethod.POST,
            clientHttpRequest -> {
              clientHttpRequest.getHeaders().setContentType(MediaType.APPLICATION_JSON);
              clientHttpRequest.getHeaders().setBearerAuth(apiKey);
              clientHttpRequest.getHeaders().set("Accept", "text/event-stream");
              clientHttpRequest.getBody().write(
                  objectMapper.writeValueAsBytes(requestBody));
            },
            clientHttpResponse -> {
              try (BufferedReader reader = new BufferedReader(
                  new InputStreamReader(clientHttpResponse.getBody()))) {
                String line;

                while ((line = reader.readLine()) != null) {
                  if (line.startsWith("data: ")) {
                    String data = line.substring(6);
                    if ("[DONE]".equals(data)) break;

                    try {
                      var node = objectMapper.readTree(data);
                      var choices = node.get("choices");
                      if (choices != null && choices.size() > 0) {
                        var delta = choices.get(0).get("delta");
                        var content = delta != null ? delta.get("content") : null;
                        if (content != null) {
                          String text = content.asText();
                          fullContent.append(text);
                          emitter.send(SseEmitter.event().name("chunk").data(text));
                        }
                      }
                    } catch (Exception e) {
                      // skip malformed chunks
                    }
                  }
                }

                emitter.send(SseEmitter.event().name("done").data(""));
                log.info("ai_chat_done user={} length={}", userId, fullContent.length());

                // Save AI response in a separate transaction
                if (fullContent.length() > 0) {
                  transactionTemplate.execute(status -> {
                    User userRef = userRepository.getReferenceById(userId);
                    chatMessageRepository.save(
                        new ChatMessage(userRef, ChatMessage.Role.AI, fullContent.toString()));
                    return null;
                  });
                }
              }
              return null;
            });
      } catch (Exception e) {
        log.error("ai_chat_error user={}", userId, e);
        try {
          emitter.send(SseEmitter.event().name("error").data("小喂走神了，稍后再试~"));
        } catch (Exception ignored) {}
      } finally {
        emitter.complete();
      }
    });

    return emitter;
  }
}
