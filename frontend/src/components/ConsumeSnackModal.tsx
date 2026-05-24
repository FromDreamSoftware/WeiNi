import { useState } from 'react';
import Modal from './Modal';
import apiClient from '../api/client';

interface SnackInfo {
  id: number;
  name: string;
  stock: number;
}

interface ConsumeSnackModalProps {
  isOpen: boolean;
  onClose: () => void;
  snack: SnackInfo | null;
  onConsumed: (id: number, newStock: number) => void;
}

export default function ConsumeSnackModal({ isOpen, onClose, snack, onConsumed }: ConsumeSnackModalProps) {
  const [count, setCount] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  if (!snack) return null;

  const clampedCount = Math.max(1, Math.min(count, snack.stock));
  const remaining = snack.stock - clampedCount;

  const handleSubmit = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      await apiClient.post(`/snacks/${snack.id}/consume`, { count: clampedCount });
      onConsumed(snack.id, remaining);
      setCount(1);
      onClose();
    } catch { /* ignore */ } finally { setSubmitting(false); }
  };

  return (
    <Modal isOpen={isOpen} onClose={() => { setCount(1); onClose(); }} title={`吃了 ${snack.name}`} size="sm"
      footer={
        <button
          onClick={handleSubmit}
          disabled={submitting || snack.stock === 0}
          className="w-full bg-pink-400 text-white rounded-lg py-2.5 text-sm font-medium disabled:opacity-50 hover:bg-pink-500 transition-colors"
        >
          {submitting ? '...' : `吃掉 x${clampedCount}`}
        </button>
      }
    >
      <div className="space-y-4">
        {snack.stock === 0 && (
          <p className="text-xs text-red-400 text-center">库存已空，请先补货</p>
        )}
        <div className="flex items-center gap-3">
          <label className="text-sm text-text-secondary whitespace-nowrap">数量</label>
          <input
            type="number"
            min={1}
            max={snack.stock}
            value={count}
            onChange={e => setCount(Number(e.target.value))}
            className="flex-1 border border-border rounded-lg px-3 py-2 text-sm"
          />
        </div>
        <div className="bg-surface-secondary rounded-lg p-3 text-center">
          <span className="text-xs text-text-muted">库存 </span>
          <span className="text-sm font-medium text-text-primary">{snack.stock}</span>
          <span className="text-xs text-text-muted mx-1">→</span>
          <span className={`text-sm font-medium ${remaining === 0 ? 'text-red-400' : 'text-green-600'}`}>{remaining}</span>
          <span className="text-xs text-text-muted"> 剩余</span>
        </div>
      </div>
    </Modal>
  );
}
