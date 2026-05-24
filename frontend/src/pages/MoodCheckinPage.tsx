import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, isSameDay, isToday, addMonths, subMonths,
  isSameMonth
} from 'date-fns';
import { ChevronLeft, ChevronRight, Flame, CalendarDays, Heart, Pencil, Trash2 } from 'lucide-react';
import apiClient from '../api/client';

import ConfirmDialog from '../components/ConfirmDialog';
import { useAuthStore } from '../stores/authStore';

const EMOJI_CATEGORIES = [
  {
    name: '常用',
    emojis: ['😊', '😄', '😍', '🥰', '😎', '🤩', '😇', '🙂', '😐', '😕', '😢', '😭', '😡', '😤', '🥺', '😰', '😴', '🎉'],
  },
  {
    name: '开心',
    emojis: ['😊', '😄', '😁', '😆', '🤣', '😂', '🥳', '😎', '😋', '😛', '😝', '😜', '🤩', '😺', '😸', '😹'],
  },
  {
    name: '爱',
    emojis: ['😍', '🥰', '😘', '😗', '😙', '😚', '💕', '💗', '💖', '💘', '💝', '💞', '💓', '❤️', '🫶', '🤗'],
  },
  {
    name: '难过',
    emojis: ['😢', '😭', '😿', '😩', '😫', '🥺', '😞', '😔', '😟', '😕', '🙁', '😣', '😖', '💔', '😥', '😰'],
  },
  {
    name: '生气',
    emojis: ['😡', '😠', '🤬', '😤', '💢', '😾', '👿', '😒', '🙄', '😑', '😐', '🖕'],
  },
  {
    name: '其他',
    emojis: ['😴', '😪', '🤒', '🤕', '😷', '🤧', '🥶', '🥵', '😵', '🤯', '😳', '🥴', '🤐', '😶', '🫥', '😱'],
  },
];

interface MoodRecord {
  id: number;
  userId: number;
  nickname: string;
  checkinDate: string;
  moodEmoji: string;
  note: string;
}

interface MoodStats {
  currentStreak: number;
  totalCheckins: number;
  mostFrequentEmoji: string;
  mostFrequentCount: number;
  longestStreak: number;
}

const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六'];

export default function MoodCheckinPage() {
  const user = useAuthStore(s => s.user);
  const userId = user?.id ?? 0;

  const [today, setToday] = useState<MoodRecord | null>(null);
  const [calendar, setCalendar] = useState<MoodRecord[]>([]);
  const [stats, setStats] = useState<MoodStats | null>(null);
  const [selectedEmoji, setSelectedEmoji] = useState('');
  const [note, setNote] = useState('');
  const [emojiTab, setEmojiTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [isEditingToday, setIsEditingToday] = useState(false);

  // Calendar state
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [editingRecord, setEditingRecord] = useState<MoodRecord | null>(null);
  const [editEmoji, setEditEmoji] = useState('');
  const [editNote, setEditNote] = useState('');

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState<MoodRecord | null>(null);

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    try {
      const monthStart = format(startOfMonth(subMonths(new Date(), 1)), 'yyyy-MM-dd');
      const monthEnd = format(endOfMonth(addMonths(new Date(), 1)), 'yyyy-MM-dd');
      const [moodsRes, statsRes] = await Promise.all([
        apiClient.get(`/moods?start=${monthStart}&end=${monthEnd}`),
        apiClient.get('/moods/stats'),
      ]);
      setCalendar(moodsRes.data);
      setStats(statsRes.data);

      const todayStr = format(new Date(), 'yyyy-MM-dd');
      const myToday = moodsRes.data.find(
        (m: MoodRecord) => m.checkinDate === todayStr && m.userId === userId
      );
      if (myToday) setToday(myToday);
    } catch { /* ignore */ } finally { setLoading(false); }
  };

  const handleCheckin = async () => {
    if (!selectedEmoji || submitting) return;
    setError('');
    setSubmitting(true);
    try {
      if (isEditingToday) {
        const { data } = await apiClient.put('/moods/today', { moodEmoji: selectedEmoji, note });
        setToday(data);
        setIsEditingToday(false);
      } else {
        const { data } = await apiClient.post('/moods', { moodEmoji: selectedEmoji, note });
        setToday(data);
      }
      setSelectedEmoji('');
      setNote('');
      loadAll();
    } catch (e: any) {
      setError(e.response?.data?.detail || (isEditingToday ? '修改失败' : '打卡失败'));
    } finally { setSubmitting(false); }
  };

  const cancelTodayEdit = () => {
    setIsEditingToday(false);
    setSelectedEmoji('');
    setNote('');
    loadAll(); // restore today from server
  };

  const handleUpdateRecord = async (record: MoodRecord) => {
    if (!editEmoji || submitting) return;
    setError('');
    setSubmitting(true);
    try {
      await apiClient.put(`/moods/${record.id}`, { moodEmoji: editEmoji, note: editNote });
      setEditingRecord(null);
      loadAll();
    } catch (e: any) {
      setError(e.response?.data?.detail || '修改失败');
    } finally { setSubmitting(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      if (deleteTarget.checkinDate === format(new Date(), 'yyyy-MM-dd')) {
        await apiClient.delete('/moods/today');
        setToday(null);
      } else {
        await apiClient.delete(`/moods/${deleteTarget.id}`);
      }
      setDeleteTarget(null);
      setSelectedDate(null);
      loadAll();
    } catch { /* ignore */ }
  };

  const startEditToday = () => {
    if (!today) return;
    setSelectedEmoji(today.moodEmoji);
    setNote(today.note || '');
    setToday(null);
    setIsEditingToday(true);
  };

  const cancelEdit = () => {
    setEditingRecord(null);
    setEditEmoji('');
    setEditNote('');
  };

  // Calendar helpers
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
  const days = eachDayOfInterval({ start: calStart, end: calEnd });

  const getDayMoods = (date: Date) =>
    calendar.filter(m => m.checkinDate === format(date, 'yyyy-MM-dd'));

  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const todayMoods = calendar.filter(m => m.checkinDate === todayStr);
  const selectedDayMoods = selectedDate
    ? calendar.filter(m => m.checkinDate === format(selectedDate, 'yyyy-MM-dd'))
    : [];

  if (loading) return <div className="flex items-center justify-center py-20 text-text-muted">加载中...</div>;

  return (
    <>
      <h1 className="text-xl text-pink-400 mb-4">😊 心情打卡</h1>

        {/* Stats Bar */}
        {stats && (
          <div className="grid grid-cols-3 gap-2 mb-4">
            <div className="bg-surface rounded-xl p-3 text-center shadow-sm">
              <Flame size={16} className="text-orange-400 mx-auto mb-1" />
              <p className="text-lg font-semibold text-text-primary">{stats.currentStreak}</p>
              <p className="text-[10px] text-text-muted">连续天数</p>
            </div>
            <div className="bg-surface rounded-xl p-3 text-center shadow-sm">
              <CalendarDays size={16} className="text-blue-400 mx-auto mb-1" />
              <p className="text-lg font-semibold text-text-primary">{stats.totalCheckins}</p>
              <p className="text-[10px] text-text-muted">共打卡</p>
            </div>
            <div className="bg-surface rounded-xl p-3 text-center shadow-sm">
              <Heart size={16} className="text-pink-400 mx-auto mb-1" />
              <p className="text-lg font-semibold text-text-primary">{stats.mostFrequentEmoji}</p>
              <p className="text-[10px] text-text-muted">最爱心情</p>
            </div>
          </div>
        )}

        {/* Today Highlight Card */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className={`rounded-2xl shadow-sm p-6 mb-4 ${today ? 'bg-gradient-to-br from-pink-100 to-rose-50 border border-pink-100' : 'bg-surface'}`}
        >
          {today ? (
            <div className="text-center">
              <p className="text-xs text-text-secondary mb-3">{format(new Date(), 'yyyy年M月d日 EEEE')}</p>
              <p className="text-6xl mb-3">{today.moodEmoji}</p>
              {today.note && <p className="text-sm text-text-secondary mb-4">{today.note}</p>}
              <div className="flex justify-center gap-3">
                <button
                  onClick={startEditToday}
                  className="flex items-center gap-1 text-xs text-pink-500 hover:text-pink-600 bg-surface/60 rounded-full px-3 py-1.5"
                >
                  <Pencil size={12} />修改
                </button>
                <button
                  onClick={() => setDeleteTarget(today)}
                  className="flex items-center gap-1 text-xs text-text-muted hover:text-red-400 bg-surface/60 rounded-full px-3 py-1.5"
                >
                  <Trash2 size={12} />删除
                </button>
              </div>
            </div>
          ) : (
            <>
              <p className="text-sm text-text-secondary mb-4 text-center font-medium">✨ 今天心情如何？</p>

              {/* Emoji category tabs */}
              <div className="flex gap-1.5 overflow-x-auto pb-2 mb-3 scrollbar-hide">
                {EMOJI_CATEGORIES.map((cat, i) => (
                  <button
                    key={cat.name}
                    onClick={() => setEmojiTab(i)}
                    className={`px-2.5 py-1 rounded-full text-xs whitespace-nowrap transition-colors ${
                      i === emojiTab ? 'bg-pink-400 text-white' : 'bg-surface-tertiary text-text-secondary'
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>

              {/* Emoji grid */}
              <div className="grid grid-cols-6 gap-1.5 mb-4">
                {EMOJI_CATEGORIES[emojiTab].emojis.map(emoji => (
                  <motion.button
                    key={emoji}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setSelectedEmoji(emoji)}
                    className={`text-2xl p-2.5 rounded-xl transition-all ${
                      selectedEmoji === emoji
                        ? 'bg-pink-100 ring-2 ring-pink-300 scale-110'
                        : 'hover:bg-surface-tertiary'
                    }`}
                  >
                    {emoji}
                  </motion.button>
                ))}
              </div>

              <input
                className="w-full border border-border rounded-lg px-3 py-2 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-pink-200"
                placeholder="说点什么...（可选）"
                value={note}
                onChange={e => setNote(e.target.value)}
              />
              {error && <p className="text-xs text-red-400 mb-2">{error}</p>}
              <div className={isEditingToday ? 'flex gap-2' : ''}>
                {isEditingToday && (
                  <button
                    onClick={cancelTodayEdit}
                    className="flex-1 bg-surface-tertiary text-text-secondary rounded-lg py-2.5 text-sm hover:bg-border-light transition-colors"
                  >
                    取消
                  </button>
                )}
                <button
                  onClick={handleCheckin}
                  disabled={!selectedEmoji || submitting}
                  className={`bg-pink-400 text-white rounded-lg py-2.5 text-sm disabled:opacity-50 hover:bg-pink-500 transition-colors ${isEditingToday ? 'flex-1' : 'w-full'}`}
                >
                  {submitting ? '保存中...' : isEditingToday ? '保存修改' : '打卡'}
                </button>
              </div>
            </>
          )}
        </motion.div>

        {/* Today's both moods */}
        {todayMoods.length > 0 && (
          <div className="bg-surface rounded-2xl shadow-sm p-4 mb-4">
            <h2 className="text-sm text-text-secondary mb-3">今天的心情</h2>
            <div className="flex justify-around">
              {todayMoods.map(m => (
                <div key={m.userId} className="text-center">
                  <p className="text-xs text-text-muted mb-1">{m.nickname}</p>
                  <p className="text-3xl my-1">{m.moodEmoji}</p>
                  {m.note && <p className="text-xs text-text-muted">{m.note}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Monthly Calendar */}
        <div className="bg-surface rounded-2xl shadow-sm p-4 mb-4">
          {/* Month navigation */}
          <div className="flex items-center justify-between mb-3">
            <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              className="p-1 text-text-muted hover:text-pink-400 transition-colors">
              <ChevronLeft size={18} />
            </button>
            <h2 className="text-sm font-medium text-text-primary">
              {format(currentMonth, 'yyyy年M月')}
            </h2>
            <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              className="p-1 text-text-muted hover:text-pink-400 transition-colors">
              <ChevronRight size={18} />
            </button>
          </div>

          {/* Weekday headers */}
          <div className="grid grid-cols-7 mb-1">
            {WEEKDAYS.map(d => (
              <div key={d} className="text-center text-[10px] text-text-muted py-1">{d}</div>
            ))}
          </div>

          {/* Days grid */}
          <div className="grid grid-cols-7 gap-0.5">
            {days.map((day, i) => {
              const dayMoods = getDayMoods(day);
              const isCurrentMonth = isSameMonth(day, currentMonth);
              const isSelected = selectedDate && isSameDay(day, selectedDate);
              const isTodayDate = isToday(day);

              return (
                <button
                  key={i}
                  onClick={() => {
                    setSelectedDate(isSelected ? null : day);
                    setEditingRecord(null);
                  }}
                  className={`aspect-square rounded-lg flex flex-col items-center justify-center text-xs transition-all
                    ${!isCurrentMonth ? 'text-text-muted opacity-40' : ''}
                    ${isSelected ? 'bg-pink-100 ring-2 ring-pink-300' : ''}
                    ${isTodayDate && !isSelected ? 'ring-1 ring-pink-300' : ''}
                    hover:bg-pink-50`}
                >
                  <span className={`text-[10px] ${isTodayDate ? 'font-semibold text-pink-500' : 'text-text-secondary'}`}>
                    {format(day, 'd')}
                  </span>
                  {dayMoods.length > 0 && (
                    <span className="text-sm leading-none mt-0.5">
                      {dayMoods[0].moodEmoji}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Day Detail Panel */}
        <AnimatePresence>
          {selectedDate && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-surface rounded-2xl shadow-sm p-5"
            >
              <h3 className="text-sm font-medium text-text-primary mb-3">
                {format(selectedDate, 'yyyy年M月d日')} 的心情
              </h3>

              {selectedDayMoods.length === 0 ? (
                <p className="text-xs text-text-muted text-center py-4">这天没有心情记录</p>
              ) : (
                <div className="space-y-3">
                  {selectedDayMoods.map(m => {
                    const isMine = m.userId === userId;
                    const isEditing = editingRecord?.id === m.id;
                    return (
                      <div key={m.id} className="flex items-center gap-3 bg-surface-secondary rounded-xl p-3">
                        <span className="text-3xl">{m.moodEmoji}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-text-secondary">{m.nickname}</p>
                          {isEditing ? (
                            <div className="mt-2 space-y-2">
                              <div className="flex gap-1">
                                {EMOJI_CATEGORIES[0].emojis.slice(0, 12).map(e => (
                                  <button key={e}
                                    onClick={() => setEditEmoji(e)}
                                    className={`text-xl p-1 rounded ${editEmoji === e ? 'bg-pink-100 ring-1 ring-pink-300' : ''}`}>
                                    {e}
                                  </button>
                                ))}
                              </div>
                              <input
                                className="w-full border border-border rounded-lg px-2 py-1 text-xs"
                                value={editNote}
                                onChange={e => setEditNote(e.target.value)}
                                placeholder="修改备注..."
                              />
                              <div className="flex gap-2">
                                <button onClick={() => handleUpdateRecord(m)}
                                  className="text-xs bg-pink-400 text-white rounded px-3 py-1">保存</button>
                                <button onClick={cancelEdit}
                                  className="text-xs bg-surface-tertiary text-text-secondary rounded px-3 py-1 hover:bg-border-light transition-colors">取消</button>
                              </div>
                            </div>
                          ) : (
                            <>
                              {m.note && <p className="text-xs text-text-secondary mt-0.5">{m.note}</p>}
                              {isMine && (
                                <div className="flex gap-2 mt-1.5">
                                  <button
                                    onClick={() => { setEditingRecord(m); setEditEmoji(m.moodEmoji); setEditNote(m.note || ''); }}
                                    className="text-xs text-pink-400 hover:text-pink-500 flex items-center gap-0.5"
                                  >
                                    <Pencil size={10} />编辑
                                  </button>
                                  <button
                                    onClick={() => setDeleteTarget(m)}
                                    className="text-xs text-text-muted hover:text-red-400 flex items-center gap-0.5"
                                  >
                                    <Trash2 size={10} />删除
                                  </button>
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Delete Confirmation */}
        <ConfirmDialog
          isOpen={!!deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleDelete}
          title="确认删除"
          message="确定要删除这条心情记录吗？此操作不可撤销。"
        />
    </>
  );
}
