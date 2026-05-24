import { useState, useEffect, useCallback } from 'react';
import { Bell } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/client';
import { useWebSocket } from '../hooks/useWebSocket';

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

export default function NotificationBell() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const fetchUnreadCount = useCallback(async () => {
    try {
      const { data } = await apiClient.get('/notifications/unread-count');
      setUnreadCount(data.count);
    } catch { /* ignore */ }
  }, []);

  const fetchRecent = useCallback(async () => {
    try {
      const { data } = await apiClient.get('/notifications?size=19');
      setNotifications(data.content || data);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => { fetchUnreadCount(); }, [fetchUnreadCount]);

  // Expose setters for NotificationsPage to sync badge and dropdown
  useEffect(() => {
    (window as any).__setUnreadCount = setUnreadCount;
    (window as any).__refreshBell = () => {
      fetchRecent();
      fetchUnreadCount();
    };
    return () => {
      delete (window as any).__setUnreadCount;
      delete (window as any).__refreshBell;
    };
  }, [fetchRecent, fetchUnreadCount]);

  const markRead = async (id: number) => {
    try {
      await apiClient.patch(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch { /* ignore */ }
  };

  useWebSocket(useCallback((data) => {
    setUnreadCount(data.unreadCount);
    setNotifications(prev => [{ ...data, isRead: false }, ...prev].slice(0, 19));
    // Also trigger toast
    const fn = (window as any).__addToast;
    if (fn) fn({
      id: Date.now().toString() + Math.random().toString(36).slice(2),
      type: data.type,
      title: data.title,
      message: data.message,
      relatedEntityType: data.relatedEntityType,
      relatedEntityId: data.relatedEntityId,
    });
  }, []));

  const handleOpen = () => {
    setOpen(!open);
    if (!open) fetchRecent();
  };

  const handleClick = (n: NotificationItem) => {
    markRead(n.id);
    setOpen(false);
    navigate('/notifications');
  };

  return (
    <div className="relative">
      <button onClick={handleOpen} className="relative p-2 rounded-full text-text-muted hover:text-accent hover:bg-surface-tertiary transition-colors">
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 text-[10px] font-bold text-blue-500">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.95 }}
              className="absolute right-0 top-full mt-2 w-72 bg-surface rounded-2xl shadow-lg border border-border z-50 overflow-hidden"
            >
              <div className="flex items-center justify-between px-4 py-3 border-b border-border-light">
                <span className="text-sm font-medium text-text-primary">通知</span>
                {unreadCount > 0 && (
                  <span className="text-xs text-text-muted">{unreadCount} 条未读</span>
                )}
              </div>

              {notifications.length === 0 ? (
                <div className="px-4 py-8 text-center text-xs text-text-muted">暂无通知</div>
              ) : (
                <div className="max-h-72 overflow-y-auto">
                  {notifications.map(n => (
                    <button
                      key={n.id}
                      onClick={() => handleClick(n)}
                      className={`w-full text-left px-4 py-3 hover:bg-surface-secondary transition-colors flex gap-3 items-start ${
                        !n.isRead ? 'bg-blue-50/50' : ''
                      }`}
                    >
                      <span className="text-lg mt-0.5">{TYPE_ICON[n.type] || '🔔'}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-text-primary truncate">{n.title}</p>
                        <p className="text-xs text-text-muted mt-0.5 line-clamp-2">{n.message}</p>
                        <p className="text-[10px] text-text-muted mt-1">{n.createdAt?.slice(0, 16).replace('T', ' ')}</p>
                      </div>
                      {!n.isRead && (
                        <span className="w-2 h-2 rounded-full bg-rose-500 mt-1.5 flex-shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              )}

              <button
                onClick={() => { setOpen(false); navigate('/notifications'); }}
                className="w-full text-center text-xs text-blue-500 py-2.5 border-t border-border-light hover:bg-surface-secondary transition-colors"
              >
                查看全部
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
