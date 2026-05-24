import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plane, UtensilsCrossed, ShoppingBag, Zap, MoreHorizontal, Plus, X, Upload, ImageIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import apiClient from '../api/client';

import PillTabs from '../components/PillTabs';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';

interface Wish {
  id: number;
  title: string;
  description: string;
  imageUrl: string;
  category: string;
  status: string;
  creatorNickname: string;
  achieverNickname?: string;
  achievedPhotoUrl: string;
  achievedAt: string;
  createdAt: string;
}

interface PageResponse {
  content: Wish[];
  totalPages: number;
  totalElements: number;
  number: number;
  size: number;
}

const CATEGORY_STYLES: Record<string, { icon: React.ReactNode; gradient: string; accent: string; accentBorder: string; bg: string; label: string }> = {
  TRAVEL: { icon: <Plane size={14} />, gradient: 'from-blue-400 to-cyan-300', accent: 'text-blue-500', accentBorder: 'border-l-blue-400', bg: 'bg-blue-50', label: '旅行' },
  FOOD: { icon: <UtensilsCrossed size={14} />, gradient: 'from-orange-400 to-amber-300', accent: 'text-orange-500', accentBorder: 'border-l-orange-400', bg: 'bg-orange-50', label: '美食' },
  THING: { icon: <ShoppingBag size={14} />, gradient: 'from-purple-400 to-pink-300', accent: 'text-purple-500', accentBorder: 'border-l-purple-400', bg: 'bg-purple-50', label: '物件' },
  EXPERIENCE: { icon: <Zap size={14} />, gradient: 'from-green-400 to-emerald-300', accent: 'text-green-500', accentBorder: 'border-l-green-400', bg: 'bg-green-50', label: '体验' },
  OTHER: { icon: <MoreHorizontal size={14} />, gradient: 'from-stone-400 to-stone-300', accent: 'text-text-secondary', accentBorder: 'border-l-stone-300', bg: 'bg-surface-secondary', label: '其他' },
};

const FILTER_TABS = [
  { value: 'ALL', label: '全部' },
  ...Object.entries(CATEGORY_STYLES).map(([k, v]) => ({ value: k, label: v.label, icon: v.icon })),
];

export default function WishlistPage() {
  const [wishes, setWishes] = useState<Wish[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState('ALL');
  const [showAchieved, setShowAchieved] = useState(false);

  // Pagination
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [pageSize, setPageSize] = useState(12);

  // Stats
  const [totalWishes, setTotalWishes] = useState(0);
  const [achievedCount, setAchievedCount] = useState(0);

  // Create/Edit modal
  const [showForm, setShowForm] = useState(false);
  const [editingWish, setEditingWish] = useState<Wish | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formCategory, setFormCategory] = useState('OTHER');
  const [formImage, setFormImage] = useState<File | null>(null);
  const [formImagePreview, setFormImagePreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Detail modal
  const [detailWish, setDetailWish] = useState<Wish | null>(null);

  // Achieve modal
  const [achieveTarget, setAchieveTarget] = useState<Wish | null>(null);
  const [achievePhoto, setAchievePhoto] = useState<File | null>(null);
  const [achievePhotoPreview, setAchievePhotoPreview] = useState<string | null>(null);

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState<Wish | null>(null);

  // Popover menu
  const [menuOpen, setMenuOpen] = useState<number | null>(null);

  const fileRef = useRef<HTMLInputElement>(null);
  const achieveFileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadWishes(0);
    loadStats();
  }, []);

  useEffect(() => {
    if (totalWishes > 0) loadWishes(0);
  }, [showAchieved, filterCategory, pageSize]);

  const loadStats = async () => {
    try {
      const [allRes, achievedRes] = await Promise.all([
        apiClient.get<PageResponse>('/wishlist', { params: { size: 1 } }),
        apiClient.get<PageResponse>('/wishlist', { params: { status: 'ACHIEVED', size: 1 } }),
      ]);
      setTotalWishes(allRes.data.totalElements);
      setAchievedCount(achievedRes.data.totalElements);
    } catch { /* ignore */ }
  };

  const loadWishes = async (pageNum: number) => {
    setLoading(true);
    try {
      const status = showAchieved ? 'ACHIEVED' : 'PENDING';
      const category = filterCategory !== 'ALL' ? filterCategory : undefined;
      const { data } = await apiClient.get<PageResponse>('/wishlist', {
        params: { category, status, page: pageNum, size: pageSize },
      });
      setWishes(data.content);
      setPage(data.number);
      setTotalPages(data.totalPages);
      setTotalElements(data.totalElements);
    } catch { /* ignore */ } finally { setLoading(false); }
  };

  const refresh = () => { loadWishes(page); loadStats(); };

  const handleFilterChange = (cat: string) => {
    setFilterCategory(cat);
    setPage(0);
  };

  const handleStatusToggle = (achieved: boolean) => {
    setShowAchieved(achieved);
    setPage(0);
  };

  const goToPage = (p: number) => {
    if (p >= 0 && p < totalPages) {
      loadWishes(p);
    }
  };

  const resetForm = () => {
    setFormTitle('');
    setFormDesc('');
    setFormCategory('OTHER');
    setFormImage(null);
    setFormImagePreview(null);
    setEditingWish(null);
  };

  const openCreate = () => {
    resetForm();
    setShowForm(true);
  };

  const openEdit = (wish: Wish) => {
    setEditingWish(wish);
    setFormTitle(wish.title);
    setFormDesc(wish.description || '');
    setFormCategory(wish.category);
    setFormImage(null);
    setFormImagePreview(wish.imageUrl || null);
    setShowForm(true);
    setMenuOpen(null);
  };

  const openDetail = (wish: Wish) => {
    setDetailWish(wish);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { alert('图片大小不能超过 10MB'); return; }
    if (formImagePreview) URL.revokeObjectURL(formImagePreview);
    setFormImage(file);
    setFormImagePreview(URL.createObjectURL(file));
  };

  const handleSubmit = async () => {
    if (!formTitle) return;
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('request', new Blob([JSON.stringify({
        title: formTitle,
        description: formDesc || null,
        category: formCategory,
      })], { type: 'application/json' }));
      if (formImage) formData.append('image', formImage);

      if (editingWish) {
        await apiClient.put(`/wishlist/${editingWish.id}`, formData);
      } else {
        await apiClient.post('/wishlist', formData);
      }
      setShowForm(false);
      resetForm();
      refresh();
    } catch { /* ignore */ } finally { setSubmitting(false); }
  };

  const handleAchieve = async () => {
    if (!achieveTarget) return;
    setSubmitting(true);
    try {
      const formData = new FormData();
      if (achievePhoto) formData.append('photo', achievePhoto);
      await apiClient.patch(`/wishlist/${achieveTarget.id}/achieve`, formData);
      setAchieveTarget(null);
      if (achievePhotoPreview) URL.revokeObjectURL(achievePhotoPreview);
      setAchievePhoto(null);
      setAchievePhotoPreview(null);
      loadWishes(0);
      loadStats();
    } catch { /* ignore */ } finally { setSubmitting(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await apiClient.delete(`/wishlist/${deleteTarget.id}`);
      setDeleteTarget(null);
      refresh();
    } catch { /* ignore */ }
  };

  const openAchieve = (wish: Wish) => {
    setAchieveTarget(wish);
    if (achievePhotoPreview) URL.revokeObjectURL(achievePhotoPreview);
    setAchievePhoto(null);
    setAchievePhotoPreview(null);
    setMenuOpen(null);
  };

  if (loading && wishes.length === 0) return <div className="min-h-screen flex items-center justify-center text-text-muted">加载中...</div>;

  const progressPercent = totalWishes > 0 ? Math.round((achievedCount / totalWishes) * 100) : 0;

  return (
    <>
      {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl text-pink-400">✨ 愿望清单</h1>
          <button onClick={openCreate}
            className="flex items-center gap-1 text-xs bg-pink-400 text-white px-3 py-1.5 rounded-full hover:bg-pink-500 transition-colors">
            <Plus size={14} />许愿
          </button>
        </div>

        {/* Progress */}
        {totalWishes > 0 && (
          <div className="bg-surface rounded-2xl shadow-sm p-4 mb-4">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-xs text-text-secondary">
                已实现 <span className="font-semibold text-pink-500">{achievedCount}</span> / {totalWishes}
              </span>
              <span className="text-xs font-medium text-pink-400">{progressPercent}%</span>
            </div>
            <div className="w-full bg-surface-tertiary rounded-full h-2.5 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                className="h-full bg-gradient-to-r from-pink-400 to-rose-400 rounded-full"
              />
            </div>
          </div>
        )}

        {/* Filter tabs */}
        <div className="mb-3">
          <PillTabs tabs={FILTER_TABS} active={filterCategory} onChange={handleFilterChange} />
        </div>

        {/* Status toggle */}
        {totalWishes > 0 && (
          <div className="flex bg-surface-tertiary rounded-lg p-1 mb-4">
            <button
              onClick={() => handleStatusToggle(false)}
              className={`flex-1 py-1.5 text-xs rounded-md transition-colors ${!showAchieved ? 'bg-surface shadow-sm text-text-primary font-medium' : 'text-text-muted'}`}
            >
              待实现
            </button>
            <button
              onClick={() => handleStatusToggle(true)}
              className={`flex-1 py-1.5 text-xs rounded-md transition-colors ${showAchieved ? 'bg-surface shadow-sm text-text-primary font-medium' : 'text-text-muted'}`}
            >
              已实现
            </button>
          </div>
        )}

        {/* Wish list */}
        {wishes.length === 0 ? (
          <div className="text-center text-text-muted py-12">
            {totalWishes === 0 ? '还没有愿望，去许一个吧~' : '没有符合条件的愿望'}
          </div>
        ) : showAchieved ? (
          /* Achieved grid */
          <div className="grid grid-cols-2 gap-3">
            {wishes.map(w => {
              const cs = CATEGORY_STYLES[w.category] || CATEGORY_STYLES.OTHER;
              return (
                <motion.div key={w.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => openDetail(w)}
                  className="bg-surface rounded-2xl shadow-sm overflow-hidden cursor-pointer hover:shadow-lg transition-shadow">
                  <div className="h-28 bg-surface-tertiary flex items-center justify-center relative">
                    {w.achievedPhotoUrl ? (
                      <img src={w.achievedPhotoUrl} alt="" className="w-full h-full object-cover" />
                    ) : w.imageUrl ? (
                      <img src={w.imageUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-3xl opacity-30">{w.category === 'TRAVEL' ? '✈️' : w.category === 'FOOD' ? '🍽️' : w.category === 'THING' ? '🛍️' : w.category === 'EXPERIENCE' ? '🎯' : '📌'}</span>
                    )}
                    {(w.achievedPhotoUrl || w.imageUrl) && (
                      <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                    )}
                  </div>
                  <div className="p-3">
                    <p className="text-sm font-medium text-text-secondary truncate">{w.title}</p>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${cs.bg} ${cs.accent}`}>
                      {cs.label}
                    </span>
                    <p className="text-[10px] text-text-muted mt-1">
                      {w.creatorNickname} 许愿{w.achieverNickname && ` · ${w.achieverNickname} 实现`}
                    </p>
                    {w.achievedAt && (
                      <p className="text-[10px] text-green-500 mt-0.5">✓ {w.achievedAt.slice(0, 10)}</p>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          /* Pending list */
          <div className="space-y-2.5">
            {wishes.map(w => {
              const cs = CATEGORY_STYLES[w.category] || CATEGORY_STYLES.OTHER;
              return (
                <motion.div key={w.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  onClick={() => openDetail(w)}
                  className={`bg-surface rounded-2xl shadow-sm border-l-[5px] ${cs.accentBorder} overflow-hidden relative cursor-pointer hover:shadow-lg transition-shadow`}>
                  <div className="p-4">
                    <div className="flex items-start gap-3">
                      {w.imageUrl && (
                        <img src={w.imageUrl} alt="" className="w-14 h-14 rounded-xl object-cover flex-shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${cs.bg} ${cs.accent}`}>
                            {cs.label}
                          </span>
                          <p className="text-sm font-medium text-text-primary truncate">{w.title}</p>
                        </div>
                        {w.description && (
                          <p className="text-xs text-text-muted line-clamp-2 mb-1">{w.description}</p>
                        )}
                        <p className="text-[10px] text-text-muted">{w.creatorNickname} 许愿 · {w.createdAt?.slice(0, 10)}</p>
                      </div>

                      {/* Action menu */}
                      <div className="relative flex-shrink-0" onClick={e => e.stopPropagation()}>
                        <button
                          onClick={() => setMenuOpen(menuOpen === w.id ? null : w.id)}
                          className="p-1 text-text-muted hover:text-text-secondary transition-colors"
                        >
                          <MoreHorizontal size={16} />
                        </button>
                        <AnimatePresence>
                          {menuOpen === w.id && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.9 }}
                              className="absolute right-0 top-8 bg-surface rounded-xl shadow-lg border border-border-light py-1 z-10 min-w-[100px]"
                            >
                              <button
                                onClick={() => openEdit(w)}
                                className="w-full text-left px-3 py-1.5 text-xs text-text-secondary hover:bg-surface-secondary flex items-center gap-2"
                              >
                                ✏️ 编辑
                              </button>
                              <button
                                onClick={() => openAchieve(w)}
                                className="w-full text-left px-3 py-1.5 text-xs text-green-600 hover:bg-green-50 flex items-center gap-2"
                              >
                                ✅ 达成
                              </button>
                              <button
                                onClick={() => { setDeleteTarget(w); setMenuOpen(null); }}
                                className="w-full text-left px-3 py-1.5 text-xs text-red-400 hover:bg-red-50 flex items-center gap-2"
                              >
                                🗑️ 删除
                              </button>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  </div>

                  {/* Click-outside to close menu */}
                  {menuOpen === w.id && (
                    <div className="fixed inset-0 z-[5]" onClick={() => setMenuOpen(null)} />
                  )}
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {totalElements > 0 && (
          <div className="mt-6 pb-2">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] text-text-muted">共 {totalElements} 条</span>
              <select
                value={pageSize}
                onChange={e => setPageSize(Number(e.target.value))}
                className="text-[11px] border border-border rounded-lg px-2 py-1 bg-surface text-text-secondary focus:outline-none focus:ring-1 focus:ring-pink-200"
              >
                {[8, 12, 24, 48].map(s => (
                  <option key={s} value={s}>{s} 条/页</option>
                ))}
              </select>
            </div>
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-1">
                <button
                  onClick={() => goToPage(page - 1)}
                  disabled={page === 0}
                  className="p-1.5 rounded-lg text-text-muted hover:bg-surface-secondary disabled:opacity-30 disabled:pointer-events-none transition-colors"
                >
                  <ChevronLeft size={16} />
                </button>
                {Array.from({ length: totalPages }, (_, i) => (
                  <button
                    key={i}
                    onClick={() => goToPage(i)}
                    className={`w-8 h-8 rounded-lg text-xs transition-colors ${
                      i === page
                        ? 'bg-pink-400 text-white'
                        : 'text-text-secondary hover:bg-surface-secondary'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
                <button
                  onClick={() => goToPage(page + 1)}
                  disabled={page === totalPages - 1}
                  className="p-1.5 rounded-lg text-text-muted hover:bg-surface-secondary disabled:opacity-30 disabled:pointer-events-none transition-colors"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
          </div>
        )}

        {/* Detail Modal */}
        <Modal
          isOpen={!!detailWish}
          onClose={() => setDetailWish(null)}
          title={detailWish?.title}
          size="md"
          footer={detailWish && detailWish.status === 'PENDING' ? (
            <div className="flex gap-2">
              <button
                onClick={() => {
                  const w = detailWish;
                  setDetailWish(null);
                  openEdit(w);
                }}
                className="flex-1 py-2 text-xs border border-border rounded-lg text-text-secondary hover:bg-surface-secondary transition-colors"
              >
                ✏️ 编辑
              </button>
              <button
                onClick={() => {
                  const w = detailWish;
                  setDetailWish(null);
                  openAchieve(w);
                }}
                className="flex-1 py-2 text-xs bg-gradient-to-r from-green-400 to-emerald-400 text-white rounded-lg hover:from-green-500 hover:to-emerald-500 transition-colors"
              >
                ✅ 达成
              </button>
              <button
                onClick={() => {
                  setDeleteTarget(detailWish);
                  setDetailWish(null);
                }}
                className="flex-1 py-2 text-xs border border-red-200 text-red-400 rounded-lg hover:bg-red-50 transition-colors"
              >
                🗑️ 删除
              </button>
            </div>
          ) : undefined}
        >
          {detailWish && (
            <div className="space-y-3">
              {detailWish.imageUrl && (
                <img src={detailWish.imageUrl} alt="" className="w-full max-h-64 object-cover rounded-xl" />
              )}
              <div className="flex items-center gap-2">
                <span className={`text-[10px] px-2 py-0.5 rounded-full ${(CATEGORY_STYLES[detailWish.category] || CATEGORY_STYLES.OTHER).bg} ${(CATEGORY_STYLES[detailWish.category] || CATEGORY_STYLES.OTHER).accent}`}>
                  {(CATEGORY_STYLES[detailWish.category] || CATEGORY_STYLES.OTHER).label}
                </span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                  detailWish.status === 'ACHIEVED' ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600'
                }`}>
                  {detailWish.status === 'ACHIEVED' ? '已实现' : '待实现'}
                </span>
              </div>
              {detailWish.description && (
                <p className="text-sm text-text-secondary leading-relaxed">{detailWish.description}</p>
              )}
              {detailWish.status === 'ACHIEVED' && detailWish.achievedPhotoUrl && (
                <div>
                  <p className="text-xs text-text-muted mb-1">达成照片</p>
                  <img src={detailWish.achievedPhotoUrl} alt="" className="w-full max-h-48 object-cover rounded-xl" />
                </div>
              )}
              <div className="flex items-center justify-between text-[11px] text-text-muted pt-1 border-t border-border-light">
                <span>{detailWish.creatorNickname} 许愿</span>
                <span>{detailWish.createdAt?.slice(0, 10)}</span>
              </div>
              {detailWish.status === 'ACHIEVED' && (
                <div className="space-y-0.5">
                  {detailWish.achieverNickname && (
                    <p className="text-[11px] text-green-500">🎉 {detailWish.achieverNickname} 实现</p>
                  )}
                  {detailWish.achievedAt && (
                    <p className="text-[11px] text-text-muted">达成于 {detailWish.achievedAt.slice(0, 10)}</p>
                  )}
                </div>
              )}
            </div>
          )}
        </Modal>

        {/* Create/Edit Modal */}
        <Modal
          isOpen={showForm}
          onClose={() => { setShowForm(false); resetForm(); }}
          title={editingWish ? '编辑愿望' : '许下新愿望'}
        >
          <div className="space-y-3">
            <input
              className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-200"
              placeholder="愿望标题"
              value={formTitle}
              onChange={e => setFormTitle(e.target.value)}
            />
            <textarea
              className="w-full border border-border rounded-lg px-3 py-2 text-sm h-20 focus:outline-none focus:ring-2 focus:ring-pink-200"
              placeholder="描述（可选）"
              value={formDesc}
              onChange={e => setFormDesc(e.target.value)}
            />

            {/* Category picker */}
            <div>
              <p className="text-xs text-text-muted mb-2">分类</p>
              <div className="flex gap-2 flex-wrap">
                {Object.entries(CATEGORY_STYLES).map(([k, v]) => (
                  <button
                    key={k}
                    onClick={() => setFormCategory(k)}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs transition-colors ${
                      formCategory === k
                        ? 'bg-pink-400 text-white'
                        : 'bg-surface-tertiary text-text-secondary hover:bg-surface-tertiary'
                    }`}
                  >
                    {v.icon} {v.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Image upload */}
            <div>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
              <div
                onClick={() => fileRef.current?.click()}
                className="border-2 border-dashed border-stone-300 rounded-xl p-4 text-center cursor-pointer hover:border-pink-300 hover:bg-pink-50 transition-colors"
              >
                {formImagePreview ? (
                  <div className="relative">
                    <img src={formImagePreview} alt="" className="max-h-32 mx-auto rounded-lg" />
                    <button
                      type="button"
                      onClick={e => { e.stopPropagation(); setFormImage(null); setFormImagePreview(null); }}
                      className="absolute top-1 right-1 bg-surface rounded-full p-0.5 shadow"
                    >
                      <X size={14} className="text-text-muted" />
                    </button>
                  </div>
                ) : (
                  <div className="text-text-muted">
                    <ImageIcon size={28} className="mx-auto mb-1 opacity-50" />
                    <p className="text-xs">添加图片（可选）</p>
                    <p className="text-[10px] text-text-muted">不超过 10MB</p>
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={handleSubmit}
              disabled={submitting || !formTitle}
              className="w-full bg-pink-400 text-white rounded-lg py-2.5 text-sm disabled:opacity-50 hover:bg-pink-500 transition-colors"
            >
              {submitting ? '保存中...' : editingWish ? '保存修改' : '许愿'}
            </button>
          </div>
        </Modal>

        {/* Achieve Modal */}
        <Modal
          isOpen={!!achieveTarget}
          onClose={() => setAchieveTarget(null)}
          title="🎉 达成愿望"
        >
          {achieveTarget && (
            <div className="space-y-3">
              <div className="text-center py-2">
                <p className="text-sm text-text-secondary">太棒了！</p>
                <p className="text-base font-medium text-text-primary mt-1">"{achieveTarget.title}"</p>
                {achieveTarget.category && (
                  <span className={`inline-block mt-1 text-[10px] px-2 py-0.5 rounded-full ${CATEGORY_STYLES[achieveTarget.category]?.bg} ${CATEGORY_STYLES[achieveTarget.category]?.accent}`}>
                    {CATEGORY_STYLES[achieveTarget.category]?.label}
                  </span>
                )}
              </div>

              {/* Photo upload */}
              <div>
                <input ref={achieveFileRef} type="file" accept="image/*" className="hidden"
                  onChange={e => {
                    const f = e.target.files?.[0];
                    if (f && f.size > 10 * 1024 * 1024) { alert('图片大小不能超过 10MB'); return; }
                    if (achievePhotoPreview) URL.revokeObjectURL(achievePhotoPreview);
                    setAchievePhoto(f || null);
                    setAchievePhotoPreview(f ? URL.createObjectURL(f) : null);
                  }} />
                <div
                  onClick={() => achieveFileRef.current?.click()}
                  className="border-2 border-dashed border-stone-300 rounded-xl p-4 text-center cursor-pointer hover:border-green-300 hover:bg-green-50 transition-colors"
                >
                  {achievePhoto ? (
                    <div className="relative">
                      <img src={achievePhotoPreview || ''} alt="" className="max-h-32 mx-auto rounded-lg" />
                      <button
                        type="button"
                        onClick={e => { e.stopPropagation(); if (achievePhotoPreview) URL.revokeObjectURL(achievePhotoPreview); setAchievePhoto(null); setAchievePhotoPreview(null); }}
                        className="absolute top-1 right-1 bg-surface rounded-full p-0.5 shadow"
                      >
                        <X size={14} className="text-text-muted" />
                      </button>
                    </div>
                  ) : (
                    <div className="text-text-muted">
                      <Upload size={24} className="mx-auto mb-1 opacity-50" />
                      <p className="text-xs">上传达成照片（可选）</p>
                      <p className="text-[10px] text-text-muted">不超过 10MB</p>
                    </div>
                  )}
                </div>
              </div>

              <button
                onClick={handleAchieve}
                disabled={submitting}
                className="w-full bg-gradient-to-r from-green-400 to-emerald-400 text-white rounded-lg py-2.5 text-sm disabled:opacity-50 hover:from-green-500 hover:to-emerald-500 transition-colors"
              >
                {submitting ? '确认中...' : '确认达成'}
              </button>
            </div>
          )}
        </Modal>

        {/* Delete Confirmation */}
        <ConfirmDialog
          isOpen={!!deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleDelete}
          title="确认删除"
          message={deleteTarget ? `确定要删除「${deleteTarget.title}」吗？此操作不可撤销。` : ''}
        />
    </>
  );
}
