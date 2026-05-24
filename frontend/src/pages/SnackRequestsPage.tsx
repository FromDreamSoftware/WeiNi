import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FolderCog, ChevronLeft, ChevronRight } from 'lucide-react';
import apiClient from '../api/client';
import { useWebSocket } from '../hooks/useWebSocket';

interface SnackRequest {
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

interface PageResponse {
  content: SnackRequest[];
  totalPages: number;
  totalElements: number;
  number: number;
  size: number;
}

const TYPE_CN: Record<string, string> = { RESTOCK: '补货', ADD: '新增', REMOVE: '下架' };
const STATUS_COLOR: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-700',
  IN_PROGRESS: 'bg-blue-100 text-blue-700',
  COMPLETED: 'bg-green-100 text-green-700',
  REJECTED: 'bg-red-100 text-red-500'
};
const STATUS_CN: Record<string, string> = {
  PENDING: '未接受',
  IN_PROGRESS: '进行中',
  COMPLETED: '已完成',
  REJECTED: '已拒绝'
};
const TYPE_ICON: Record<string, string> = { RESTOCK: '📦', ADD: '✨', REMOVE: '🗑️' };

export default function SnackRequestsPage() {
  const [requests, setRequests] = useState<SnackRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [pageSize, setPageSize] = useState(12);

  const loadRequests = async (pageNum: number = 0) => {
    setLoading(true);
    try {
      const { data } = await apiClient.get<PageResponse>('/snack-requests', {
        params: { page: pageNum, size: pageSize },
      });
      setRequests(data.content);
      setPage(data.number);
      setTotalPages(data.totalPages);
      setTotalElements(data.totalElements);
    } catch { /* ignore */ } finally { setLoading(false); }
  };

  useEffect(() => { loadRequests(0); }, [pageSize]);

  const loadRequestsRef = useRef(loadRequests);
  loadRequestsRef.current = loadRequests;

  useWebSocket(useCallback((data: any) => {
    if (data.type === 'SNACK_REQUEST') loadRequestsRef.current(page);
  }, [page]));

  const handleAction = async (id: number, status: string) => {
    try {
      await apiClient.patch(`/snack-requests/${id}?status=${status}`);
      loadRequests(page);
    } catch { /* ignore */ }
  };

  const goToPage = (p: number) => {
    if (p >= 0 && p < totalPages) loadRequests(p);
  };

  if (loading) return <div className="flex items-center justify-center py-20 text-text-muted">加载中...</div>;

  const pending = requests.filter(r => r.status === 'PENDING' || r.status === 'IN_PROGRESS');
  const resolved = requests.filter(r => r.status === 'COMPLETED' || r.status === 'REJECTED');

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl sm:text-2xl font-semibold text-text-primary">🛒 零食请求</h1>
        <Link
          to="/boyfriend/snack-categories"
          className="flex items-center gap-1 text-xs text-text-muted hover:text-accent transition-colors"
        >
          <FolderCog size={14} />
          管理分类
        </Link>
      </div>

      {requests.length === 0 ? (
        <div className="text-center text-text-muted py-12">暂无请求</div>
      ) : (
        <>
          {/* Pending */}
          {pending.length > 0 && (
            <div className="mb-6">
              <h2 className="text-sm font-medium text-text-secondary mb-3">待处理 & 进行中 ({pending.length})</h2>
              <div className="space-y-3">
                {pending.map(req => (
                  <motion.div
                    key={req.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-surface rounded-2xl shadow-md border border-card-border/30 p-4"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{TYPE_ICON[req.type] || '📋'}</span>
                        <div>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLOR[req.status]}`}>
                            {STATUS_CN[req.status]}
                          </span>
                          <span className="text-xs text-text-muted ml-2">{TYPE_CN[req.type]}</span>
                        </div>
                      </div>
                      <span className="text-[10px] text-text-muted">
                        {req.createdAt?.slice(0, 16).replace('T', ' ')}
                      </span>
                    </div>

                    <p className="text-sm font-medium text-text-primary">{req.snackName}</p>

                    <div className="text-xs text-text-muted mt-1 space-y-0.5">
                      {req.type === 'RESTOCK' && (
                        <p>补货数量: <span className="text-text-secondary font-medium">+{req.count}</span></p>
                      )}
                      {req.type === 'ADD' && (
                        <>
                          <p>分类: {req.categoryName || '其他'}</p>
                          <p>初始库存: {req.count}</p>
                        </>
                      )}
                      {req.type === 'REMOVE' && (
                        <p>请求下架该零食</p>
                      )}
                      {req.reason && <p>备注: {req.reason}</p>}
                      <p>来自: {req.requesterNickname}</p>
                    </div>

                    <div className="flex gap-2 mt-3">
                      {req.status === 'PENDING' && (
                        <button
                          onClick={() => handleAction(req.id, 'IN_PROGRESS')}
                          className="flex-1 bg-blue-100 text-blue-700 rounded-lg py-1.5 text-xs font-medium hover:bg-blue-200 transition-colors"
                        >
                          接单
                        </button>
                      )}
                      <button
                        onClick={() => handleAction(req.id, 'COMPLETED')}
                        className="flex-1 bg-accent text-white rounded-lg py-1.5 text-xs font-medium hover:bg-accent-hover transition-colors"
                      >
                        完成
                      </button>
                      <button
                        onClick={() => handleAction(req.id, 'REJECTED')}
                        className="flex-1 bg-surface-tertiary text-text-secondary rounded-lg py-1.5 text-xs hover:bg-border-light transition-colors"
                      >
                        拒绝
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Resolved */}
          {resolved.length > 0 && (
            <div>
              <h2 className="text-sm font-medium text-text-secondary mb-3">已处理</h2>
              <div className="space-y-2">
                {resolved.map(req => (
                  <div key={req.id} className="bg-surface rounded-xl shadow-md border border-card-border/30 px-4 py-3 opacity-70">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLOR[req.status]}`}>
                          {STATUS_CN[req.status]}
                        </span>
                        <span className="text-xs text-text-muted">{TYPE_CN[req.type]}</span>
                        <span className="text-sm text-text-secondary">{req.snackName}</span>
                        {req.count > 1 && (
                          <span className="text-xs text-text-muted">x{req.count}</span>
                        )}
                      </div>
                      {req.handlerNickname && (
                        <span className="text-[10px] text-text-muted">处理人: {req.handlerNickname}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
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
        </>
      )}
    </>
  );
}
