package com.weini.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "snack_categories")
public class SnackCategory {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(nullable = false, unique = true, length = 50)
  private String name;

  @Column(name = "created_at", updatable = false)
  private LocalDateTime createdAt;

  @PrePersist
  void onCreate() {
    this.createdAt = LocalDateTime.now();
  }

  public SnackCategory() {}

  public Long getId() { return id; }
  public String getName() { return name; }
  public LocalDateTime getCreatedAt() { return createdAt; }

  public void setId(Long id) { this.id = id; }
  public void setName(String name) { this.name = name; }
}
