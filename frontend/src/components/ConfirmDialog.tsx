import { AlertTriangle } from 'lucide-react';
import Modal from './Modal';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message: string;
  confirmLabel?: string;
}

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title = '确认操作',
  message,
  confirmLabel = '确认删除',
}: ConfirmDialogProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm">
      <div className="text-center">
        <div className="mx-auto w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mb-3">
          <AlertTriangle size={24} className="text-red-400" />
        </div>
        <h3 className="text-sm font-medium text-text-primary mb-2">{title}</h3>
        <p className="text-sm text-text-secondary">{message}</p>
      </div>
      <div className="flex gap-3 mt-4">
        <button
          onClick={onClose}
          className="flex-1 bg-surface-tertiary text-text-secondary rounded-lg py-2 text-sm hover:bg-surface-tertiary transition-colors"
        >
          取消
        </button>
        <button
          onClick={() => { onConfirm(); onClose(); }}
          className="flex-1 bg-red-400 text-white rounded-lg py-2 text-sm hover:bg-red-500 transition-colors"
        >
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
