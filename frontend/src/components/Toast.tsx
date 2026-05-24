import { useState, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export interface ToastMessage {
  id: string;
  type: string;
  title: string;
  message: string;
  relatedEntityType?: string;
  relatedEntityId?: number;
}

const TYPE_ICON: Record<string, string> = {
  SNACK_REQUEST: '🛒',
  MEAL_ORDER: '🍜',
  WORK_ORDER: '📋',
  COOKING_RATING: '⭐',
  SYSTEM: '🔔',
};

export default function ToastContainer() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const navigate = useNavigate();

  const addToast = useCallback((toast: ToastMessage) => {
    setToasts(prev => [...prev.slice(-4), toast]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== toast.id));
    }, 4000);
  }, []);

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Expose addToast globally for useWebSocket callback
  useEffect(() => {
    (window as any).__addToast = addToast;
    return () => { delete (window as any).__addToast; };
  }, [addToast]);

  const handleClick = (t: ToastMessage) => {
    removeToast(t.id);
    if (t.relatedEntityType === 'snack_request') navigate('/approvals');
    else if (t.relatedEntityType === 'meal_order') navigate('/meals');
    else if (t.relatedEntityType === 'work_order') navigate('/approvals');
    else if (t.relatedEntityType === 'cooking_record') navigate('/cooking');
    else navigate('/notifications');
  };

  return createPortal(
    <div className="fixed bottom-4 right-4 z-[200] flex flex-col gap-2 pointer-events-none">
      <AnimatePresence>
        {toasts.map(toast => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, x: 80, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 80, scale: 0.95 }}
            className="pointer-events-auto bg-surface rounded-2xl shadow-lg border border-card-border/50 px-4 py-3 w-80 cursor-pointer hover:shadow-xl transition-shadow"
            onClick={() => handleClick(toast)}
          >
            <div className="flex items-start gap-3">
              <span className="text-lg mt-0.5">{TYPE_ICON[toast.type] || '🔔'}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-text-primary truncate">{toast.title}</p>
                <p className="text-xs text-text-secondary mt-0.5 line-clamp-2">{toast.message}</p>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); removeToast(toast.id); }}
                className="text-text-muted hover:text-text-secondary transition-colors flex-shrink-0"
              >
                <X size={14} />
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>,
    document.body
  );
}

// Hook to add toast from anywhere
export function useToast() {
  return useCallback((toast: Omit<ToastMessage, 'id'>) => {
    const fn = (window as any).__addToast;
    if (fn) fn({ ...toast, id: Date.now().toString() + Math.random().toString(36).slice(2) });
  }, []);
}
