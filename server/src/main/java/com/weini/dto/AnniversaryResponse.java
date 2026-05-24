package com.weini.dto;

import com.weini.entity.Anniversary;
import com.weini.entity.AnniversaryType;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;

public record AnniversaryResponse(
    Long id,
    String title,
    LocalDate eventDate,
    AnniversaryType type,
    String displayType,
    String icon,
    String customType,
    String imageUrl,
    long daysUntil
) {
  public static AnniversaryResponse from(Anniversary a) {
    return from(a, null);
  }

  public static AnniversaryResponse from(Anniversary a, String presignedImageUrl) {
    long days = ChronoUnit.DAYS.between(LocalDate.now(), a.getEventDate());
    return new AnniversaryResponse(
        a.getId(),
        a.getTitle(),
        a.getEventDate(),
        a.getType(),
        labelFor(a),
        a.getIcon(),
        a.getCustomType(),
        presignedImageUrl,
        days
    );
  }

  private static String labelFor(Anniversary a) {
    if (a.getType() == AnniversaryType.CUSTOM && a.getCustomType() != null) {
      return a.getCustomType();
    }
    return switch (a.getType()) {
      case MARRIED -> "结婚纪念日";
      case BIRTHDAY -> "生日";
      case FIRST_MET -> "初见";
      case DATING -> "恋爱纪念日";
      case CUSTOM -> "其他";
    };
  }
}
