import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import apiClient from '../api/client';


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

const CATEGORY_CN: Record<string, string> = { BUG: '🐛', FEATURE: '💡', COMPLAINT: '😤', WISH: '✨' };
const PRIORITY_COLOR: Record<string, string> = { LOW: 'bg-surface-tertiary text-text-secondary', MEDIUM: 'bg-amber-100 text-amber-700', HIGH: 'bg-red-100 text-red-500' };
const STATUS_COLOR: Record<string, string> = { SUBMITTED: 'bg-surface-tertiary text-text-secondary', ACCEPTED: 'bg-blue-100 text-blue-700', IN_PROGRESS: 'bg-amber-100 text-amber-700', DONE: 'bg-green-100 text-green-700', REJECTED: 'bg-red-100 text-red-500' };
const STATUS_CN: Record<string, string> = { SUBMITTED: '已提交', ACCEPTED: '已受理', IN_PROGRESS: '处理中', DONE: '已完成', REJECTED: '已拒绝' };

const NEXT_STATUS: Record<string, string> = {
  SUBMITTED: 'ACCEPTED',
  ACCEPTED: 'IN_PROGRESS',
  IN_PROGRESS: 'DONE',
};

export default function WorkOrderManagePage() {
  const [orders, setOrders] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'PENDING' | 'DONE'>('PENDING');
  const [handlerNote, setHandlerNote] = useState<Record<number, string>>({});
  const [expanded, setExpanded] = useState<number | null>(null);

  useEffect(() => { loadOrders(); }, []);

  const loadOrders = async () => {
    try {
      const { data } = await apiClient.get('/work-orders');
      setOrders(data);
    } catch { /* ignore */ } finally { setLoading(false); }
  };

  const updateStatus = async (id: number, status: string) => {
    const note = handlerNote[id] || undefined;
    try {
      await apiClient.patch(`/work-orders/${id}?status=${status}${note ? `&handlerNote=${encodeURIComponent(note)}` : ''}`);
      setHandlerNote(prev => { const next = { ...prev }; delete next[id]; return next; });
      loadOrders();
    } catch { /* ignore */ }
  };

  if (loading) return <div className="flex items-center justify-center py-20 text-text-muted">加载中...</div>;

  const pendingOrders = orders.filter(o => o.status !== 'DONE' && o.status !== 'REJECTED');
  const doneOrders = orders.filter(o => o.status === 'DONE' || o.status === 'REJECTED');
  const displayed = activeTab === 'PENDING' ? pendingOrders : doneOrders;

  return (
    <>
      <h1 className="text-xl text-pink-400 mb-4">📋 工单管理</h1>

        {/* Tabs */}
        <div className="flex gap-2 mb-4">
          <button onClick={() => setActiveTab('PENDING')}
            className={`px-4 py-1.5 rounded-full text-xs ${activeTab === 'PENDING' ? 'bg-pink-400 text-white' : 'bg-surface-tertiary text-text-secondary'}`}>
            处理中 ({pendingOrders.length})
          </button>
          <button onClick={() => setActiveTab('DONE')}
            className={`px-4 py-1.5 rounded-full text-xs ${activeTab === 'DONE' ? 'bg-pink-400 text-white' : 'bg-surface-tertiary text-text-secondary'}`}>
            已办结 ({doneOrders.length})
          </button>
        </div>

        {displayed.length === 0 ? (
          <div className="text-center text-text-muted py-12">暂无工单</div>
        ) : (
          <div className="space-y-3">
            {displayed.map(order => (
              <motion.div key={order.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="bg-surface rounded-2xl shadow-sm p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs">{CATEGORY_CN[order.category]}</span>
                      <span className="text-sm font-medium text-text-primary truncate">{order.title}</span>
                      <span className={`text-xs px-1.5 py-0.5 rounded-full ${PRIORITY_COLOR[order.priority]}`}>
                        {order.priority === 'HIGH' ? '急' : order.priority === 'LOW' ? '低' : '中'}
                      </span>
                    </div>
                    <p className="text-xs text-text-muted">来自: {order.creatorNickname} · {order.createdAt?.slice(0, 10)}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full whitespace-nowrap ${STATUS_COLOR[order.status]}`}>
                    {STATUS_CN[order.status]}
                  </span>
                </div>

                {/* Expandable detail */}
                <button onClick={() => setExpanded(expanded === order.id ? null : order.id)}
                  className="text-xs text-pink-400 mt-2">
                  {expanded === order.id ? '收起' : '详情'}
                </button>
                {expanded === order.id && (
                  <div className="mt-3 pt-3 border-t border-border-light">
                    {order.description && <p className="text-xs text-text-secondary mb-2">{order.description}</p>}
                    {order.handlerNote && <p className="text-xs text-text-muted mb-2">备注: {order.handlerNote}</p>}

                    {order.status !== 'DONE' && order.status !== 'REJECTED' && (
                      <>
                        <input className="w-full border border-border rounded-lg px-3 py-1.5 text-xs mb-2"
                          placeholder="处理备注（可选）"
                          value={handlerNote[order.id] || ''}
                          onChange={e => setHandlerNote({ ...handlerNote, [order.id]: e.target.value })} />
                        <div className="flex gap-2">
                          <button onClick={() => updateStatus(order.id, NEXT_STATUS[order.status])}
                            className="flex-1 bg-pink-400 text-white rounded-lg py-1.5 text-xs">
                            {order.status === 'SUBMITTED' ? '受理' : order.status === 'ACCEPTED' ? '开始处理' : '标记完成'}
                          </button>
                          <button onClick={() => updateStatus(order.id, 'REJECTED')}
                            className="px-4 bg-surface-tertiary text-text-secondary rounded-lg py-1.5 text-xs hover:bg-border-light transition-colors">拒绝</button>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}
    </>
  );
}
