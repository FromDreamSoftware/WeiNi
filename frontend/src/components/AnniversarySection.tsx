import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import apiClient from '../api/client';

interface Anniversary {
  id: number;
  title: string;
  eventDate: string;
  type: string;
  displayType: string;
  icon: string;
  customType: string | null;
  imageUrl: string | null;
  daysUntil: number;
}

const TYPE_OPTIONS = [
  { value: 'MARRIED', label: '结婚纪念日', emoji: '💍' },
  { value: 'BIRTHDAY', label: '生日', emoji: '🎂' },
  { value: 'FIRST_MET', label: '初见', emoji: '✨' },
  { value: 'DATING', label: '恋爱纪念日', emoji: '💝' },
  { value: 'CUSTOM', label: '其他', emoji: '📝' },
] as const;

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
}

function countdownText(days: number) {
  if (days === 0) return { text: '就是今天！', color: 'text-rose-500', bg: 'bg-rose-50' };
  if (days > 0) return { text: `还有 ${days} 天`, color: 'text-pink-500', bg: 'bg-pink-50' };
  return { text: `已过去 ${Math.abs(days)} 天`, color: 'text-text-muted', bg: 'bg-surface-secondary' };
}

export default function AnniversarySection() {
  const [anniversaries, setAnniversaries] = useState<Anniversary[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    title: '', eventDate: '', type: 'DATING', customType: '', icon: '💕',
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    apiClient.get('/anniversaries').then(({ data }) => setAnniversaries(data)).catch(() => {});
  }, []);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      alert('图片大小不能超过 10MB');
      return;
    }
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const addAnniversary = async () => {
    if (!form.title || !form.eventDate || submitting) return;
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('title', form.title);
      fd.append('eventDate', form.eventDate);
      fd.append('type', form.type);
      if (form.type === 'CUSTOM' && form.customType.trim()) {
        fd.append('customType', form.customType.trim());
      }
      fd.append('icon', form.icon || '💕');
      if (imageFile) fd.append('image', imageFile);

      const { data } = await apiClient.post('/anniversaries', fd);
      setAnniversaries(prev => [...prev, data]);
      setForm({ title: '', eventDate: '', type: 'DATING', customType: '', icon: '💕' });
      setImageFile(null);
      setImagePreview(null);
      setShowForm(false);
    } catch {
      // ignore
    } finally {
      setSubmitting(false);
    }
  };

  const delAnniversary = async (id: number) => {
    await apiClient.delete(`/anniversaries/${id}`);
    setAnniversaries(prev => prev.filter(a => a.id !== id));
  };

  const nearest = anniversaries
    .filter(a => a.daysUntil >= 0)
    .sort((a, b) => a.daysUntil - b.daysUntil)[0] || anniversaries[0];

  return (
    <div className="bg-surface rounded-2xl shadow-sm p-5 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-medium text-text-secondary">📅 纪念日</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="text-xs text-pink-400 hover:text-pink-500 transition-colors"
        >
          {showForm ? '收起' : '+ 添加'}
        </button>
      </div>

      {/* Countdown banner */}
      {nearest && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-pink-50 to-rose-50 rounded-xl p-4 mb-4 text-center border border-pink-100"
        >
          <p className="text-xs text-text-secondary mb-1">
            {nearest.daysUntil === 0 ? '🎉' : nearest.daysUntil > 0 ? '📆' : '💫'}
          </p>
          <p className={`text-lg font-semibold ${nearest.daysUntil === 0 ? 'text-rose-500' : nearest.daysUntil > 0 ? 'text-pink-500' : 'text-text-secondary'}`}>
            {countdownText(nearest.daysUntil).text}
          </p>
          <p className="text-sm text-text-primary mt-1">
            {nearest.icon} {nearest.title}
          </p>
          <p className="text-xs text-text-muted mt-0.5">
            {formatDate(nearest.eventDate)} · {nearest.displayType}
          </p>
        </motion.div>
      )}

      {/* Add form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-surface-secondary rounded-xl p-4 mb-4 space-y-3">
              <input
                className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-surface focus:outline-none focus:ring-2 focus:ring-pink-200"
                placeholder="标题，如「在一起的日子」"
                value={form.title}
                onChange={e => setForm({ ...form, title: e.target.value })}
              />
              <input
                type="date"
                className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-surface focus:outline-none focus:ring-2 focus:ring-pink-200"
                value={form.eventDate}
                onChange={e => setForm({ ...form, eventDate: e.target.value })}
              />
              <div>
                <select
                  className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-surface focus:outline-none focus:ring-2 focus:ring-pink-200"
                  value={form.type}
                  onChange={e => setForm({ ...form, type: e.target.value, customType: '' })}
                >
                  {TYPE_OPTIONS.map(o => (
                    <option key={o.value} value={o.value}>{o.emoji} {o.label}</option>
                  ))}
                </select>
              </div>
              {form.type === 'CUSTOM' && (
                <motion.input
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="w-full border border-pink-200 rounded-lg px-3 py-2 text-sm bg-surface focus:outline-none focus:ring-2 focus:ring-pink-200"
                  placeholder="输入自定义类型，如「第一次旅行」"
                  value={form.customType}
                  onChange={e => setForm({ ...form, customType: e.target.value })}
                />
              )}
              <div className="flex gap-3">
                <input
                  className="w-20 border border-border rounded-lg px-3 py-2 text-sm text-center bg-surface focus:outline-none focus:ring-2 focus:ring-pink-200"
                  placeholder="💕"
                  value={form.icon}
                  onChange={e => setForm({ ...form, icon: e.target.value })}
                  maxLength={4}
                />
                <span className="text-xs text-text-muted self-center">图标（emoji）</span>
              </div>

              {/* Image upload */}
              <div>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageChange}
                />
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="w-16 h-16 border-2 border-dashed border-stone-300 rounded-xl flex items-center justify-center
                               hover:border-pink-300 hover:bg-pink-50 transition-colors"
                  >
                    {imagePreview ? (
                      <img src={imagePreview} alt="预览" className="w-full h-full object-cover rounded-xl" />
                    ) : (
                      <span className="text-2xl text-text-muted">🖼️</span>
                    )}
                  </button>
                  <div className="text-xs text-text-muted">
                    <p>上传纪念图片</p>
                    <p>正方形图片效果最佳，不超过 10MB</p>
                    {imageFile && (
                      <button
                        type="button"
                        onClick={() => { setImageFile(null); setImagePreview(null); }}
                        className="text-pink-400 mt-0.5"
                      >
                        移除
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <button
                onClick={addAnniversary}
                disabled={submitting}
                className="w-full bg-pink-400 text-white rounded-lg py-2 text-sm hover:bg-pink-500
                           disabled:opacity-50 transition-colors"
              >
                {submitting ? '添加中...' : '添加纪念日'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Anniversary cards */}
      {anniversaries.length === 0 ? (
        <p className="text-xs text-text-muted text-center py-4">还没有纪念日，点击「+ 添加」来创建</p>
      ) : (
        <div className="space-y-2">
          {anniversaries.map(a => {
            const cd = countdownText(a.daysUntil);
            return (
              <motion.div
                key={a.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-3 bg-surface-secondary rounded-xl p-3 group hover:bg-surface-tertiary transition-colors"
              >
                {/* Image or placeholder */}
                <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 bg-gradient-to-br from-pink-200 to-rose-200
                                flex items-center justify-center">
                  {a.imageUrl ? (
                    <img src={a.imageUrl} alt={a.title} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xl">{a.icon || '💕'}</span>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-text-primary truncate">
                      {a.icon} {a.title}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-pink-100 text-pink-500 flex-shrink-0">
                      {a.displayType}
                    </span>
                  </div>
                  <p className="text-xs text-text-muted mt-0.5">{formatDate(a.eventDate)}</p>
                  <p className={`text-xs mt-0.5 font-medium ${cd.color}`}>{cd.text}</p>
                </div>

                {/* Delete */}
                <button
                  onClick={() => delAnniversary(a.id)}
                  className="text-text-muted hover:text-rose-400 text-xs opacity-0 group-hover:opacity-100 transition-all"
                >
                  删除
                </button>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
