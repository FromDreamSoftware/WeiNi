import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { CheckCheck, ChevronLeft, ChevronRight } from 'lucide-react';
import apiClient from '../api/client';
import { useWebSocket } from '../hooks/useWebSocket';
import Modal from '../components/Modal';

interface NotificationItem {
  id: number;
  type: string;
  title: string;
  message: string;
  relatedEntityId: number | null;
  relatedEntityType: string | null;
  isRead: boolean;
  createdAt: string;
}

const TYPE_ICON: Record<string, string> = {
  SNACK_REQUEST: '🛒',
  MEAL_ORDER: '🍜',
  WORK_ORDER: '📋',
  COOKING_RATING: '⭐',
  SYSTEM: '🔔',
};

const TYPE_CN: Record<string, string> = {
  SNACK_REQUEST: '零食请求',
  MEAL_ORDER: '点菜请求',
  WORK_ORDER: '工单',
  COOKING_RATING: '烹饪评分',
  SYSTEM: '系统',
};

const PAGE_SIZE = 15;

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<NotificationItem | null>(null);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  const loadPage = useCallback(async (p: number) => {
    setLoading(true);
    try {
      const { data } = await apiClient.get(`/notifications?page=${p}&size=${PAGE_SIZE}&days=99`);
      setNotifications(data.content || data);
      setTotalPages(data.totalPages || 0);
      setTotalElements(data.totalElements || 0);
    } catch { /* ignore */ } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    loadPage(page);
  }, [page, loadPage]);

  useWebSocket(useCallback(() => {
    loadPage(page);
  }, [page, loadPage]));

  const syncBell = async () => {
    try {
      const { data } = await apiClient.get('/notifications/unread-count');
      (window as any).__setUnreadCount?.(data.count);
      (window as any).__refreshBell?.();
    } catch { /* ignore */ }
  };

  const markAllRead = async () => {
    try {
      await apiClient.patch('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      (window as any).__setUnreadCount?.(0);
      (window as any).__refreshBell?.();
    } catch { /* ignore */ }
  };

  const markAllUnread = async () => {
    try {
      const { data } = await apiClient.patch('/notifications/unread-all?days=99');
      setNotifications(prev => prev.map(n => ({ ...n, isRead: false })));
      (window as any).__setUnreadCount?.(data.count || notifications.length);
      (window as any).__refreshBell?.();
    } catch { /* ignore */ }
  };

  const markRead = async (id: number) => {
    try {
      await apiClient.patch(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
      syncBell();
    } catch { /* ignore */ }
  };

  const handleClick = (n: NotificationItem) => {
    if (!n.isRead) markRead(n.id);
    setSelected(n);
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;
  const formatTime = (s: string) => s?.slice(0, 16).replace('T', ' ');

  if (loading) return <div className="flex items-center justify-center py-20 text-text-muted">加载中...</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl text-accent">🔔 通知中心</h1>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button onClick={markAllRead}
              className="flex items-center gap-1 text-xs text-blue-500 hover:text-blue-600 transition-colors">
              <CheckCheck size={14} />
              全部已读
            </button>
          )}
          <button onClick={markAllUnread}
            className="flex items-center gap-1 text-xs text-blue-500 hover:text-blue-600 transition-colors">
            全部未读
          </button>
        </div>
      </div>

      {notifications.length === 0 ? (
        <div className="text-center text-text-muted py-16">暂无通知</div>
      ) : (
        <>
          <div className="space-y-1.5">
            {notifications.map(n => (
              <motion.div
                key={n.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onClick={() => handleClick(n)}
                className={`bg-surface rounded-xl shadow-sm p-3 flex gap-2.5 items-start cursor-pointer hover:shadow-md transition-shadow ${
                  !n.isRead ? 'ring-1 ring-blue-200' : ''
                }`}
              >
                <span className="text-base mt-0.5">{TYPE_ICON[n.type] || '🔔'}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-xs font-medium text-text-primary">{n.title}</p>
                    {!n.isRead && (
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500 flex-shrink-0" />
                    )}
                  </div>
                  <p className="text-[11px] text-text-secondary mt-0.5 line-clamp-1">{n.message}</p>
                  <p className="text-[10px] text-text-muted mt-1">
                    {formatTime(n.createdAt)}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>

          {(
            <div className="flex items-center justify-between pt-3">
              <span className="text-xs text-text-muted">共 {totalElements} 条</span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="p-1 rounded-lg text-text-muted hover:text-accent disabled:opacity-30 transition-colors"
                >
                  <ChevronLeft size={16} />
                </button>
                {Array.from({ length: totalPages }, (_, i) => (
                  <button
                    key={i}
                    onClick={() => setPage(i)}
                    className={`w-7 h-7 text-xs rounded-lg transition-colors ${
                      i === page
                        ? 'bg-blue-500 text-white'
                        : 'text-text-muted hover:bg-surface-tertiary'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
                <button
                  onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                  className="p-1 rounded-lg text-text-muted hover:text-accent disabled:opacity-30 transition-colors"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
              <span className="text-xs text-text-muted">{page + 1} / {totalPages} 页</span>
            </div>
          )}
        </>
      )}

      <Modal isOpen={selected !== null} onClose={() => setSelected(null)} title="消息详情" size="sm">
        {selected && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{TYPE_ICON[selected.type] || '🔔'}</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-surface-tertiary text-text-secondary">
                {TYPE_CN[selected.type] || selected.type}
              </span>
              {!selected.isRead && (
                <span className="w-2 h-2 rounded-full bg-rose-500" />
              )}
            </div>
            <h2 className="text-base font-medium text-text-primary">{selected.title}</h2>
            <p className="text-sm text-text-secondary leading-relaxed whitespace-pre-wrap">{selected.message}</p>
            <p className="text-xs text-text-muted">{formatTime(selected.createdAt)}</p>
          </div>
        )}
      </Modal>
    </div>
  );
}
