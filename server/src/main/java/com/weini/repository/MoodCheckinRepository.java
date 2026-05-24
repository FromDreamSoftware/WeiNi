package com.weini.repository;

import com.weini.entity.MoodCheckin;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface MoodCheckinRepository extends JpaRepository<MoodCheckin, Long> {

  Optional<MoodCheckin> findByUserIdAndCheckinDate(Long userId, LocalDate date);

  List<MoodCheckin> findByCheckinDateBetweenOrderByCheckinDateAsc(LocalDate start, LocalDate end);

  List<MoodCheckin> findByUserIdAndCheckinDateBetweenOrderByCheckinDateAsc(Long userId, LocalDate start, LocalDate end);

  long countByUserId(Long userId);

  List<MoodCheckin> findByUserIdOrderByCheckinDateDesc(Long userId);

  @Query("SELECT m.moodEmoji, COUNT(m) FROM MoodCheckin m WHERE m.user.id = :userId GROUP BY m.moodEmoji ORDER BY COUNT(m) DESC")
  List<Object[]> countByUserIdGroupByEmoji(@Param("userId") Long userId);
}
