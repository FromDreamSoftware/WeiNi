import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import apiClient from '../api/client';
import PillTabs from '../components/PillTabs';
import { useWebSocket } from '../hooks/useWebSocket';

interface SnackReq {
  id: number;
  type: string;
  snackName: string;
  categoryName: string;
  count: number;
  reason: string;
  status: string;
  requesterNickname: string;
  handlerNickname: string;
  createdAt: string;
  resolvedAt: string;
}

interface MealOrd {
  id: number;
  orderDate: string;
  mealType: string;
  dishName: string;
  notes: string;
  status: string;
  orderedByNickname: string;
  handlerNickname: string;
  createdAt: string;
  completedAt: string;
}

const VIEW_TABS = [
  { value: 'pending', label: '待我审批' },
  { value: 'my', label: '我的请求' },
];

const REVIEW_SIZE = 4;
const HISTORY_SIZE = 10;

const SNACK_TYPE_ICON: Record<string, string> = { RESTOCK: '📦', ADD: '✨', REMOVE: '🗑️' };
const SNACK_TYPE_CN: Record<string, string> = { RESTOCK: '补货', ADD: '新增', REMOVE: '下架' };
const MEAL_TYPE_CN: Record<string, string> = { BREAKFAST: '早餐', LUNCH: '午餐', DINNER: '晚餐' };

const STATUS_COLOR: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-700',
  SUBMITTED: 'bg-amber-100 text-amber-700',
  IN_PROGRESS: 'bg-blue-100 text-blue-700',
  ACCEPTED: 'bg-blue-100 text-blue-700',
  COOKING: 'bg-purple-100 text-purple-700',
  COMPLETED: 'bg-green-100 text-green-700',
  DONE: 'bg-green-100 text-green-700',
  REJECTED: 'bg-red-100 text-red-500',
};

const STATUS_CN: Record<string, string> = {
  PENDING: '未接受', SUBMITTED: '已提交',
  IN_PROGRESS: '进行中', ACCEPTED: '已受理',
  COOKING: '烹饪中', COMPLETED: '已完成', DONE: '已完成',
  REJECTED: '已拒绝',
};

const TYPE_TABS_SNACK = [
  { value: 'snack', label: '零食审核', myLabel: '零食请求' },
  { value: 'meal', label: '点菜审核', myLabel: '点菜请求' },
];

export default function ApprovalCenterPage() {
  const [view, setView] = useState<'pending' | 'my'>('pending');
  const [type, setType] = useState<'snack' | 'meal'>('snack');
  const [loading, setLoading] = useState(true);

  // Review cards
  const [reviewItems, setReviewItems] = useState<(SnackReq | MealOrd)[]>([]);

  // History — independent type selection
  const [historyType, setHistoryType] = useState<'snack' | 'meal'>('snack');
  const [historyPage, setHistoryPage] = useState(0);
  const [historyTotalPages, setHistoryTotalPages] = useState(0);
  const [historyTotalElements, setHistoryTotalElements] = useState(0);
  const [historyItems, setHistoryItems] = useState<(SnackReq | MealOrd)[]>([]);

  const api = view === 'pending'
    ? (type === 'snack' ? '/snack-requests' : '/meal-orders')
    : (type === 'snack' ? '/snack-requests' : '/meal-orders');

  const loadReview = useCallback(async () => {
    try {
      const { data } = await apiClient.get(`${api}?view=${view}&size=${REVIEW_SIZE}`);
      const items = data.content || data;
      setReviewItems(Array.isArray(items) ? items : []);
    } catch { /* ignore */ }
  }, [view, type]);

  const historyApi = historyType === 'snack'
    ? `/snack-requests?view=${view}&page=`
    : `/meal-orders?view=${view}&page=`;

  const loadHistory = useCallback(async (p: number) => {
    setLoading(true);
    try {
      const { data } = await apiClient.get(`${historyApi}${p}&size=${HISTORY_SIZE}`);
      setHistoryItems(data.content || data);
      setHistoryTotalPages(data.totalPages || 0);
      setHistoryTotalElements(data.totalElements || 0);
    } catch { /* ignore */ } finally { setLoading(false); }
  }, [view, historyType]);

  useEffect(() => {
    setHistoryPage(0);
    loadReview();
    loadHistory(0);
  }, [loadReview, loadHistory]);

  useWebSocket(useCallback(() => {
    loadReview();
    loadHistory(historyPage);
  }, [loadReview, loadHistory, historyPage]), { types: ['SNACK_REQUEST', 'MEAL_ORDER'] });

  const handleSnackAction = async (id: number, status: string) => {
    await apiClient.patch(`/snack-requests/${id}?status=${status}`);
    loadReview();
    loadHistory(historyPage);
  };

  const handleMealAction = async (id: number, status: string) => {
    await apiClient.patch(`/meal-orders/${id}?status=${status}`);
    loadReview();
    loadHistory(historyPage);
  };

  const showActions = view === 'pending';
  const formatTime = (s: string) => s?.slice(0, 16).replace('T', ' ');
  const formatDate = (s: string) => s?.slice(0, 10);

  const getSnackActions = (s: SnackReq) => {
    const btns: { label: string; status: string; className: string }[] = [];
    if (s.status === 'PENDING') {
      btns.push({ label: '接单', status: 'IN_PROGRESS', className: 'bg-blue-500 text-white hover:bg-blue-600' });
      btns.push({ label: '拒绝', status: 'REJECTED', className: 'bg-surface-tertiary text-text-secondary hover:bg-red-100 hover:text-red-600' });
    } else if (s.status === 'IN_PROGRESS') {
      btns.push({ label: '完成', status: 'COMPLETED', className: 'bg-accent text-white hover:bg-accent-hover' });
      btns.push({ label: '拒绝', status: 'REJECTED', className: 'bg-surface-tertiary text-text-secondary hover:bg-red-100 hover:text-red-600' });
    }
    return btns;
  };

  const getMealActions = (m: MealOrd) => {
    const btns: { label: string; status: string; className: string }[] = [];
    if (m.status === 'PENDING') {
      btns.push({ label: '接单', status: 'IN_PROGRESS', className: 'bg-blue-500 text-white hover:bg-blue-600' });
      btns.push({ label: '拒绝', status: 'REJECTED', className: 'bg-surface-tertiary text-text-secondary hover:bg-red-100 hover:text-red-600' });
    } else if (m.status === 'IN_PROGRESS') {
      btns.push({ label: '完成', status: 'COMPLETED', className: 'bg-accent text-white hover:bg-accent-hover' });
      btns.push({ label: '拒绝', status: 'REJECTED', className: 'bg-surface-tertiary text-text-secondary hover:bg-red-100 hover:text-red-600' });
    }
    return btns;
  };

  return (
    <div className="space-y-5">
      <h1 className="text-xl text-accent">📋 审批中心</h1>

      {/* View tabs */}
      <PillTabs tabs={VIEW_TABS} active={view} onChange={v => setView(v as 'pending' | 'my')} />

      {/* Type sub-tabs */}
      <PillTabs
        tabs={TYPE_TABS_SNACK.map(t => ({ value: t.value, label: view === 'my' ? t.myLabel : t.label }))}
        active={type}
        onChange={v => setType(v as 'snack' | 'meal')}
      />

      {/* Review cards */}
      <div>
        <h2 className="text-sm font-medium text-text-secondary mb-3">
          {view === 'pending' ? '新处理审核' : '进行中的请求'}
          {reviewItems.length > 0 && <span className="text-text-muted ml-1">({reviewItems.length})</span>}
        </h2>

        {reviewItems.length === 0 ? (
          <div className="text-center text-text-muted py-8 text-sm bg-surface rounded-xl border border-card-border/30">
            暂无{view === 'pending' ? '待审核' : '进行中的'}请求
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {type === 'snack' && reviewItems.map(s => {
              const sr = s as SnackReq;
              return (
                <motion.div key={sr.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  className="bg-surface rounded-xl shadow-md border border-card-border/30 overflow-hidden"
                >
                  <div className="h-1 bg-gradient-to-r from-accent to-accent/30" />
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{SNACK_TYPE_ICON[sr.type] || '📋'}</span>
                        <span className="text-xs text-text-muted">{SNACK_TYPE_CN[sr.type]}</span>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLOR[sr.status] || 'bg-surface-tertiary text-text-secondary'}`}>
                        {STATUS_CN[sr.status] || sr.status}
                      </span>
                    </div>

                    <p className="text-base font-semibold text-text-primary mb-2">{sr.snackName}</p>

                    <div className="space-y-1 text-xs text-text-secondary mb-3">
                      {sr.type === 'ADD' && (
                        <p><span className="text-text-muted">分类:</span> {sr.categoryName || '其他'}  <span className="text-text-muted ml-2">初始库存:</span> {sr.count}</p>
                      )}
                      {sr.type === 'RESTOCK' && (
                        <p><span className="text-text-muted">数量:</span> +{sr.count}  {sr.reason && <span className="text-text-muted ml-2">原因:</span>} {sr.reason}</p>
                      )}
                      {sr.type === 'REMOVE' && (
                        <p><span className="text-text-muted">下架</span>  {sr.reason && <span className="text-text-muted ml-2">原因:</span>} {sr.reason}</p>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-xs text-text-muted mb-3">
                      <span>{view === 'pending' ? '请求人' : '审核人'}: {view === 'pending' ? sr.requesterNickname : (sr.handlerNickname || '未指定')}</span>
                      <span>{formatTime(sr.createdAt)}</span>
                    </div>

                    {showActions && (
                      <div className="flex gap-2">
                        {getSnackActions(sr).map(a => (
                          <button key={a.status} onClick={() => handleSnackAction(sr.id, a.status)}
                            className={`flex-1 rounded-lg py-2 text-xs font-medium transition-colors ${a.className}`}>
                            {a.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}

            {type === 'meal' && reviewItems.map(m => {
              const mo = m as MealOrd;
              return (
                <motion.div key={mo.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  className="bg-surface rounded-xl shadow-md border border-card-border/30 overflow-hidden"
                >
                  <div className="h-1 bg-gradient-to-r from-accent to-accent/30" />
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">🍽️</span>
                        <span className="text-xs text-text-muted">{MEAL_TYPE_CN[mo.mealType] || mo.mealType}</span>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLOR[mo.status] || 'bg-surface-tertiary text-text-secondary'}`}>
                        {STATUS_CN[mo.status] || mo.status}
                      </span>
                    </div>

                    <p className="text-base font-semibold text-text-primary mb-2">{mo.dishName}</p>

                    <div className="space-y-1 text-xs text-text-secondary mb-3">
                      <p><span className="text-text-muted">日期:</span> {mo.orderDate}</p>
                      {mo.notes && <p><span className="text-text-muted">备注:</span> {mo.notes}</p>}
                    </div>

                    <div className="flex items-center justify-between text-xs text-text-muted mb-3">
                      <span>{view === 'pending' ? '请求人' : '审核人'}: {view === 'pending' ? mo.orderedByNickname : (mo.handlerNickname || '未指定')}</span>
                      <span>{formatTime(mo.createdAt)}</span>
                    </div>

                    {showActions && (
                      <div className="flex gap-2">
                        {getMealActions(mo).map(a => (
                          <button key={a.status} onClick={() => handleMealAction(mo.id, a.status)}
                            className={`flex-1 rounded-lg py-2 text-xs font-medium transition-colors ${a.className}`}>
                            {a.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* History section */}
      <div>
        <div className="flex items-center gap-3 mb-3">
          <h2 className="text-sm font-medium text-text-secondary">相关审核记录</h2>
          <div className="flex gap-1">
            <button
              onClick={() => { setHistoryType('snack'); setHistoryPage(0); }}
              className={`px-3 py-1 text-xs rounded-full transition-colors ${
                historyType === 'snack' ? 'bg-accent text-white' : 'bg-surface-tertiary text-text-muted hover:text-text-secondary'
              }`}
            >
              零食审核记录
            </button>
            <button
              onClick={() => { setHistoryType('meal'); setHistoryPage(0); }}
              className={`px-3 py-1 text-xs rounded-full transition-colors ${
                historyType === 'meal' ? 'bg-accent text-white' : 'bg-surface-tertiary text-text-muted hover:text-text-secondary'
              }`}
            >
              点菜审核记录
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center text-text-muted py-8">加载中...</div>
        ) : historyItems.length === 0 ? (
          <div className="text-center text-text-muted py-8 text-sm bg-surface rounded-xl border border-card-border/30">暂无记录</div>
        ) : (
          <>
            <div className="space-y-1.5">
              {historyItems.map(item => {
                if (historyType === 'snack') {
                  const s = item as SnackReq;
                  return (
                    <div key={item.id}
                      className="bg-surface rounded-xl shadow-sm border border-card-border/30 px-4 py-2.5 flex items-center gap-3 text-xs"
                    >
                      <span className="text-base flex-shrink-0">{SNACK_TYPE_ICON[s.type] || '📋'}</span>
                      <span className="text-text-muted flex-shrink-0">{SNACK_TYPE_CN[s.type] || s.type}</span>
                      <span className="font-medium text-text-primary truncate">{s.snackName}</span>
                      <span className="text-text-muted flex-shrink-0">· {view === 'pending' ? s.requesterNickname : (s.handlerNickname || '未指定')}</span>
                      <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium flex-shrink-0 ${STATUS_COLOR[s.status] || 'bg-surface-tertiary text-text-secondary'}`}>
                        {STATUS_CN[s.status] || s.status}
                      </span>
                      <span className="text-text-muted flex-shrink-0 ml-auto">{formatDate(s.createdAt)}</span>
                    </div>
                  );
                } else {
                  const m = item as MealOrd;
                  return (
                    <div key={item.id}
                      className="bg-surface rounded-xl shadow-sm border border-card-border/30 px-4 py-2.5 flex items-center gap-3 text-xs"
                    >
                      <span className="text-base flex-shrink-0">🍽️</span>
                      <span className="text-text-muted flex-shrink-0">{MEAL_TYPE_CN[m.mealType] || m.mealType}</span>
                      <span className="font-medium text-text-primary truncate">{m.dishName}</span>
                      <span className="text-text-muted flex-shrink-0">· {view === 'pending' ? m.orderedByNickname : (m.handlerNickname || '未指定')}</span>
                      <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium flex-shrink-0 ${STATUS_COLOR[m.status] || 'bg-surface-tertiary text-text-secondary'}`}>
                        {STATUS_CN[m.status] || m.status}
                      </span>
                      <span className="text-text-muted flex-shrink-0 ml-auto">{formatDate(m.createdAt)}</span>
                    </div>
                  );
                }
              })}
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between pt-3">
              <span className="text-xs text-text-muted">共 {historyTotalElements} 条</span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setHistoryPage(p => { const np = Math.max(0, p - 1); loadHistory(np); return np; })}
                  disabled={historyPage === 0}
                  className="p-1 rounded-lg text-text-muted hover:text-accent disabled:opacity-30 transition-colors"
                >
                  <ChevronLeft size={16} />
                </button>
                {Array.from({ length: historyTotalPages }, (_, i) => (
                  <button
                    key={i}
                    onClick={() => { setHistoryPage(i); loadHistory(i); }}
                    className={`w-7 h-7 text-xs rounded-lg transition-colors ${
                      i === historyPage
                        ? 'bg-blue-500 text-white'
                        : 'text-text-muted hover:bg-surface-tertiary'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
                <button
                  onClick={() => setHistoryPage(p => { const np = Math.min(historyTotalPages - 1, p + 1); loadHistory(np); return np; })}
                  disabled={historyPage >= historyTotalPages - 1}
                  className="p-1 rounded-lg text-text-muted hover:text-accent disabled:opacity-30 transition-colors"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
              <span className="text-xs text-text-muted">{historyPage + 1} / {historyTotalPages} 页</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
