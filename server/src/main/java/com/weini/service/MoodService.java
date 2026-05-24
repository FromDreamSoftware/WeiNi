package com.weini.service;

import com.weini.dto.MoodCheckinRequest;
import com.weini.dto.MoodResponse;
import com.weini.dto.MoodStatsResponse;
import com.weini.entity.MoodCheckin;
import com.weini.entity.User;
import com.weini.repository.MoodCheckinRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
@Transactional(readOnly = true)
public class MoodService {

  private static final Logger log = LoggerFactory.getLogger(MoodService.class);

  private final MoodCheckinRepository moodCheckinRepository;
  private final UserService userService;

  public MoodService(MoodCheckinRepository moodCheckinRepository, UserService userService) {
    this.moodCheckinRepository = moodCheckinRepository;
    this.userService = userService;
  }

  public List<MoodResponse> getCalendar(LocalDate start, LocalDate end, Long userId) {
    var stream = userId != null
        ? moodCheckinRepository.findByUserIdAndCheckinDateBetweenOrderByCheckinDateAsc(userId, start, end).stream()
        : moodCheckinRepository.findByCheckinDateBetweenOrderByCheckinDateAsc(start, end).stream();
    return stream.map(MoodResponse::from).toList();
  }

  public MoodResponse getToday(Long userId) {
    return moodCheckinRepository.findByUserIdAndCheckinDate(userId, LocalDate.now())
        .map(MoodResponse::from)
        .orElse(null);
  }

  @Transactional
  public MoodResponse checkin(Long userId, MoodCheckinRequest request) {
    LocalDate today = LocalDate.now();
    if (moodCheckinRepository.findByUserIdAndCheckinDate(userId, today).isPresent()) {
      throw new IllegalArgumentException("今天已经打卡过了，可以修改心情");
    }

    User user = userService.findById(userId)
        .orElseThrow(() -> new IllegalArgumentException("用户不存在"));

    MoodCheckin checkin = new MoodCheckin(user, today, request.moodEmoji(), request.note());
    MoodCheckin saved = moodCheckinRepository.save(checkin);
    log.info("mood_checkin userId={} mood={}", userId, request.moodEmoji());
    return MoodResponse.from(saved);
  }

  @Transactional
  public MoodResponse updateToday(Long userId, MoodCheckinRequest request) {
    LocalDate today = LocalDate.now();
    MoodCheckin checkin = moodCheckinRepository.findByUserIdAndCheckinDate(userId, today)
        .orElseThrow(() -> new IllegalArgumentException("今天还没有打卡，不能修改"));

    checkin.updateMood(request.moodEmoji(), request.note());
    log.info("mood_updated userId={} mood={}", userId, request.moodEmoji());
    return MoodResponse.from(checkin);
  }

  @Transactional
  public MoodResponse update(Long userId, Long checkinId, MoodCheckinRequest request) {
    MoodCheckin checkin = moodCheckinRepository.findById(checkinId)
        .orElseThrow(() -> new IllegalArgumentException("打卡记录不存在"));
    if (!checkin.getUser().getId().equals(userId)) {
      throw new IllegalArgumentException("只能修改自己的打卡记录");
    }
    checkin.updateMood(request.moodEmoji(), request.note());
    log.info("mood_updated userId={} checkinId={}", userId, checkinId);
    return MoodResponse.from(checkin);
  }

  @Transactional
  public void delete(Long userId, Long checkinId) {
    MoodCheckin checkin = moodCheckinRepository.findById(checkinId)
        .orElseThrow(() -> new IllegalArgumentException("打卡记录不存在"));
    if (!checkin.getUser().getId().equals(userId)) {
      throw new IllegalArgumentException("只能删除自己的打卡记录");
    }
    moodCheckinRepository.delete(checkin);
    log.info("mood_deleted userId={} checkinId={}", userId, checkinId);
  }

  @Transactional
  public void deleteToday(Long userId) {
    MoodCheckin checkin = moodCheckinRepository.findByUserIdAndCheckinDate(userId, LocalDate.now())
        .orElseThrow(() -> new IllegalArgumentException("今天还没有打卡，无法删除"));
    moodCheckinRepository.delete(checkin);
    log.info("mood_deleted_today userId={}", userId);
  }

  public MoodStatsResponse getStats(Long userId) {
    List<MoodCheckin> all = moodCheckinRepository.findByUserIdOrderByCheckinDateDesc(userId);
    int total = all.size();

    // current streak from today backwards
    int currentStreak = 0;
    LocalDate expected = LocalDate.now();
    for (MoodCheckin m : all) {
      if (m.getCheckinDate().equals(expected)) {
        currentStreak++;
        expected = expected.minusDays(1);
      } else if (currentStreak == 0 && m.getCheckinDate().equals(LocalDate.now().minusDays(1))) {
        expected = LocalDate.now().minusDays(1);
        currentStreak++;
        expected = expected.minusDays(1);
      } else {
        break;
      }
    }

    // longest streak from all records
    int longestStreak = 0;
    int run = 0;
    LocalDate prev = null;
    for (int i = all.size() - 1; i >= 0; i--) {
      LocalDate d = all.get(i).getCheckinDate();
      if (prev == null) {
        run = 1;
      } else if (prev.plusDays(1).equals(d)) {
        run++;
      } else {
        run = 1;
      }
      if (run > longestStreak) longestStreak = run;
      prev = d;
    }

    List<Object[]> freq = moodCheckinRepository.countByUserIdGroupByEmoji(userId);
    String mostFreqEmoji = freq.isEmpty() ? "😊" : (String) freq.get(0)[0];
    long mostFreqCount = freq.isEmpty() ? 0 : (Long) freq.get(0)[1];

    return new MoodStatsResponse(currentStreak, total, mostFreqEmoji, mostFreqCount, longestStreak);
  }
}
