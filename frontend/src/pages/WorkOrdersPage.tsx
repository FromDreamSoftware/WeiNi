import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import apiClient from '../api/client';
import { useAuthStore } from '../stores/authStore';
import { useWebSocket } from '../hooks/useWebSocket';
import ApproverSelector from '../components/ApproverSelector';

interface WorkOrder {
  id: number;
  title: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  creatorNickname: string;
  handlerNickname: string;
  handlerNote: string;
  createdAt: string;
  resolvedAt: string;
}

interface PageResponse {
  content: WorkOrder[];
  totalPages: number;
  totalElements: number;
  number: number;
  size: number;
}

const CATEGORY_CN: Record<string, string> = { BUG: '🐛 Bug', FEATURE: '💡 建议', COMPLAINT: '😤 投诉', WISH: '✨ 愿望' };
const PRIORITY_COLOR: Record<string, string> = { LOW: 'bg-surface-tertiary text-text-secondary', MEDIUM: 'bg-amber-100 text-amber-700', HIGH: 'bg-red-100 text-red-500' };
const PRIORITY_CN: Record<string, string> = { HIGH: '紧急', LOW: '不急', MEDIUM: '一般' };
const STATUS_COLOR: Record<string, string> = {
  SUBMITTED: 'bg-surface-tertiary text-text-secondary',
  ACCEPTED: 'bg-blue-100 text-blue-700',
  IN_PROGRESS: 'bg-amber-100 text-amber-700',
  DONE: 'bg-green-100 text-green-700',
  REJECTED: 'bg-red-100 text-red-500',
};
const STATUS_CN: Record<string, string> = {
  SUBMITTED: '已提交', ACCEPTED: '已受理', IN_PROGRESS: '处理中', DONE: '已完成', REJECTED: '已拒绝',
};

export default function WorkOrdersPage() {
  const user = useAuthStore(s => s.user);
  const isGirl = user?.role === 'GIRLFRIEND';

  const [orders, setOrders] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [pageSize, setPageSize] = useState(12);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('WISH');
  const [priority, setPriority] = useState('MEDIUM');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [approver, setApprover] = useState<{ id: number; nickname: string; avatarUrl: string | null } | null>(null);

  const loadOrders = async (pageNum: number) => {
    setLoading(true);
    try {
      const view = useAuthStore.getState().user?.role === 'GIRLFRIEND' ? 'my' : 'pending';
      const { data } = await apiClient.get<PageResponse>('/work-orders', {
        params: { view, period: 'year', page: pageNum, size: pageSize },
      });
      setOrders(data.content);
      setPage(data.number);
      setTotalPages(data.totalPages);
      setTotalElements(data.totalElements);
    } catch { /* ignore */ } finally { setLoading(false); }
  };

  useEffect(() => { loadOrders(0); }, [pageSize]);

  const loadOrdersRef = useRef(loadOrders);
  loadOrdersRef.current = loadOrders;

  useWebSocket(useCallback((data: any) => {
    if (data.type === 'WORK_ORDER') loadOrdersRef.current(page);
  }, [page]));

  const goToPage = (p: number) => {
    if (p >= 0 && p < totalPages) loadOrders(p);
  };

  const submitOrder = async () => {
    if (!title) return;
    if (!approver) { setMessage('请选择审批人'); return; }
    setSubmitting(true);
    setMessage('');
    try {
      await apiClient.post('/work-orders', { title, description: description || null, category, priority, assigneeId: approver.id });
      setTitle('');
      setDescription('');
      setShowForm(false);
      setApprover(null);
      loadOrders(0);
    } catch (e: any) {
      setMessage(e.response?.data?.detail || '提交失败');
    } finally { setSubmitting(false); }
  };

  const handleAction = async (id: number, status: string) => {
    await apiClient.patch(`/work-orders/${id}?status=${status}`);
    loadOrders(page);
  };

  const getActions = (w: WorkOrder) => {
    const btns: { label: string; status: string; className: string }[] = [];
    if (w.status === 'SUBMITTED') {
      btns.push({ label: '受理', status: 'ACCEPTED', className: 'bg-blue-100 text-blue-700' });
      btns.push({ label: '拒绝', status: 'REJECTED', className: 'bg-surface-tertiary text-text-secondary' });
    } else if (w.status === 'ACCEPTED') {
      btns.push({ label: '开始处理', status: 'IN_PROGRESS', className: 'bg-blue-100 text-blue-700' });
    } else if (w.status === 'IN_PROGRESS') {
      btns.push({ label: '标记完成', status: 'DONE', className: 'bg-accent text-white' });
      btns.push({ label: '拒绝', status: 'REJECTED', className: 'bg-surface-tertiary text-text-secondary' });
    }
    return btns;
  };

  const formatTime = (s: string) => s?.slice(0, 16).replace('T', ' ');

  if (!user) return null;

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl text-pink-400">📋 工单</h1>
        {isGirl && (
          <button onClick={() => setShowForm(!showForm)} className="text-xs bg-pink-400 text-white px-3 py-1.5 rounded-full">
            + 提交工单
          </button>
        )}
      </div>

      {/* Submit form — girlfriend only */}
      {isGirl && showForm && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-surface rounded-2xl shadow-sm p-5 mb-4">
          <input className="w-full border border-border rounded-lg px-3 py-2 text-sm mb-3 bg-surface"
            placeholder="标题" value={title} onChange={e => setTitle(e.target.value)} />
          <textarea className="w-full border border-border rounded-lg px-3 py-2 text-sm mb-3 h-20 bg-surface"
            placeholder="详细描述（可选）" value={description} onChange={e => setDescription(e.target.value)} />
          <div className="flex gap-2 mb-3">
            <select className="flex-1 border border-border rounded-lg px-3 py-2 text-sm bg-surface"
              value={category} onChange={e => setCategory(e.target.value)}>
              <option value="BUG">🐛 Bug</option>
              <option value="FEATURE">💡 建议</option>
              <option value="COMPLAINT">😤 投诉</option>
              <option value="WISH">✨ 愿望</option>
            </select>
            <select className="flex-1 border border-border rounded-lg px-3 py-2 text-sm bg-surface"
              value={priority} onChange={e => setPriority(e.target.value)}>
              <option value="LOW">低优先</option>
              <option value="MEDIUM">中优先</option>
              <option value="HIGH">高优先</option>
            </select>
          </div>
          <div className="mb-3">
            <ApproverSelector value={approver} onChange={setApprover} />
          </div>
          {message && <p className="text-xs text-pink-400 mb-3">{message}</p>}
          <button onClick={submitOrder} disabled={submitting || !title}
            className="w-full bg-pink-400 text-white rounded-lg py-2 text-sm disabled:opacity-50">提交</button>
        </motion.div>
      )}

      {/* Order list */}
      {loading ? (
        <div className="flex items-center justify-center py-20 text-text-muted">加载中...</div>
      ) : orders.length === 0 ? (
        <div className="text-center text-text-muted py-12">
          {isGirl ? '暂无工单，去提一个吧~' : '暂无待审批工单'}
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map(order => (
            <motion.div key={order.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="bg-surface rounded-2xl shadow-sm p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs">{CATEGORY_CN[order.category]?.split(' ')[0]}</span>
                    <p className="text-sm font-medium text-text-primary truncate">{order.title}</p>
                    <span className={`text-xs px-1.5 py-0.5 rounded-full ${PRIORITY_COLOR[order.priority]}`}>
                      {PRIORITY_CN[order.priority]}
                    </span>
                  </div>
                  {order.description && <p className="text-xs text-text-muted mt-1 line-clamp-2">{order.description}</p>}
                  <div className="flex items-center gap-3 mt-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLOR[order.status]}`}>
                      {STATUS_CN[order.status]}
                    </span>
                    <span className="text-xs text-text-muted">
                      {isGirl ? `审批人: ${order.handlerNickname || '未指定'}` : `来自: ${order.creatorNickname}`}
                    </span>
                    <span className="text-[10px] text-text-muted">{formatTime(order.createdAt)}</span>
                  </div>
                </div>
              </div>
              {!isGirl && getActions(order).length > 0 && (
                <div className="flex gap-2 mt-3">
                  {getActions(order).map(a => (
                    <button key={a.status} onClick={() => handleAction(order.id, a.status)}
                      className={`flex-1 rounded-lg py-1.5 text-xs font-medium hover:opacity-80 transition-opacity ${a.className}`}>
                      {a.label}
                    </button>
                  ))}
                </div>
              )}
            </motion.div>
          ))}
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
        </div>
      )}
    </>
  );
}
