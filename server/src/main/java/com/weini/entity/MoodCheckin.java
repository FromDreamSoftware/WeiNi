package com.weini.entity;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "mood_checkins",
    uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "checkin_date"}))
public class MoodCheckin {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "user_id", nullable = false)
  private User user;

  @Column(name = "checkin_date", nullable = false)
  private LocalDate checkinDate;

  @Column(name = "mood_emoji", nullable = false, length = 10)
  private String moodEmoji;

  @Column(length = 255)
  private String note;

  @Column(name = "created_at", updatable = false)
  private LocalDateTime createdAt;

  protected MoodCheckin() {
  }

  public MoodCheckin(User user, LocalDate checkinDate, String moodEmoji, String note) {
    this.user = user;
    this.checkinDate = checkinDate;
    this.moodEmoji = moodEmoji;
    this.note = note;
  }

  @PrePersist
  void onCreate() {
    this.createdAt = LocalDateTime.now();
  }

  public void updateMood(String moodEmoji, String note) {
    this.moodEmoji = moodEmoji;
    this.note = note;
  }

  public Long getId() { return id; }
  public User getUser() { return user; }
  public LocalDate getCheckinDate() { return checkinDate; }
  public String getMoodEmoji() { return moodEmoji; }
  public String getNote() { return note; }
  public LocalDateTime getCreatedAt() { return createdAt; }
}
