package com.weini.service;

import com.weini.entity.Role;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@Service
public class EmailService {

  private static final Logger log = LoggerFactory.getLogger(EmailService.class);

  private final JavaMailSender mailSender;

  @Value("${spring.mail.username}")
  private String from;

  @Value("${app.notification.girlfriend-email}")
  private String girlfriendEmail;

  @Value("${app.notification.boyfriend-email}")
  private String boyfriendEmail;

  public EmailService(JavaMailSender mailSender) {
    this.mailSender = mailSender;
  }

  @Async("emailExecutor")
  public void sendTo(Role role, String subject, String bodyText) {
    String to = role == Role.BOYFRIEND ? boyfriendEmail : girlfriendEmail;
    if (to == null || to.isBlank()) {
      log.warn("Skipping email — no email configured for role {}", role);
      return;
    }
    try {
      MimeMessage message = mailSender.createMimeMessage();
      MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
      helper.setTo(to);
      helper.setFrom(from);
      helper.setSubject(subject);
      helper.setText(buildHtml(subject, bodyText), true);
      mailSender.send(message);
      log.info("email_sent to={} role={} subject={}", to, role, subject);
    } catch (MessagingException e) {
      log.error("email_failed to={} subject={} error={}", to, subject, e.getMessage());
    }
  }

  private String buildHtml(String subject, String bodyText) {
    String time = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm"));
    return """
        <!DOCTYPE html>
        <html>
        <head><meta charset="UTF-8"></head>
        <body style="margin:0;padding:0;background:#fafafa;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
          <table width="100%%" cellpadding="0" cellspacing="0" style="max-width:480px;margin:40px auto;">
            <tr>
              <td style="background:linear-gradient(135deg,#f9a8d4,#f472b6);padding:28px 24px;border-radius:16px 16px 0 0;">
                <h1 style="margin:0;color:#fff;font-size:20px;">🍜 喂你 · WeiNi</h1>
              </td>
            </tr>
            <tr>
              <td style="background:#fff;padding:24px;border-radius:0 0 16px 16px;box-shadow:0 1px 3px rgba(0,0,0,0.06);">
                <h2 style="margin:0 0 12px;color:#333;font-size:16px;">%s</h2>
                <p style="margin:0 0 20px;color:#666;font-size:14px;line-height:1.6;">%s</p>
                <p style="margin:0;color:#999;font-size:12px;">%s · 喂你</p>
              </td>
            </tr>
          </table>
        </body>
        </html>
        """.formatted(subject, bodyText, time);
  }
}
