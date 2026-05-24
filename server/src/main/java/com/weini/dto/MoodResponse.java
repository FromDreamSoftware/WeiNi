package com.weini.dto;

import com.weini.entity.MoodCheckin;
import java.time.LocalDate;

public record MoodResponse(
    Long id,
    Long userId,
    String nickname,
    LocalDate checkinDate,
    String moodEmoji,
    String note
) {
  public static MoodResponse from(MoodCheckin m) {
    return new MoodResponse(
        m.getId(),
        m.getUser().getId(),
        m.getUser().getNickname(),
        m.getCheckinDate(),
        m.getMoodEmoji(),
        m.getNote()
    );
  }
}
