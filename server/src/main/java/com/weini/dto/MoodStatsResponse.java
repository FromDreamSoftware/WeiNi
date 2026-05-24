package com.weini.dto;

public record MoodStatsResponse(
    int currentStreak,
    int totalCheckins,
    String mostFrequentEmoji,
    long mostFrequentCount,
    int longestStreak
) {}
