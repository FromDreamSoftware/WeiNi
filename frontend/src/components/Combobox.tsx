import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

interface ComboboxProps<T> {
  items: T[];
  value: T | null;
  onChange: (item: T) => void;
  search: string;
  onSearchChange: (search: string) => void;
  renderItem: (item: T) => React.ReactNode;
  getKey: (item: T) => string;
  getDisplayValue?: (item: T) => string;
  placeholder?: string;
}

export default function Combobox<T>({
  items,
  value,
  onChange,
  search,
  onSearchChange,
  renderItem,
  getKey,
  getDisplayValue,
  placeholder = '搜索...',
}: ComboboxProps<T>) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        containerRef.current && !containerRef.current.contains(target) &&
        dropdownRef.current && !dropdownRef.current.contains(target)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const [dropdownStyle, setDropdownStyle] = useState<{ top: number; left: number; width: number }>({ top: 0, left: 0, width: 0 });

  const updatePosition = () => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setDropdownStyle({ top: rect.bottom + 4, left: rect.left, width: rect.width });
    }
  };

  const displayValue = value
    ? (search || getDisplayValue?.(value) || '')
    : search;

  const dropdown = (
    <AnimatePresence>
      {open && items.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          className="fixed bg-surface rounded-xl border border-border shadow-lg z-[100] max-h-48 overflow-y-auto"
          style={{ top: dropdownStyle.top, left: dropdownStyle.left, width: dropdownStyle.width }}
        >
          {items.map(item => (
            <button
              key={getKey(item)}
              type="button"
              onClick={() => { onChange(item); setOpen(false); onSearchChange(getDisplayValue?.(item) ?? ''); }}
              className="w-full text-left px-3 py-2.5 text-sm hover:bg-surface-secondary transition-colors"
            >
              {renderItem(item)}
            </button>
          ))}
        </motion.div>
      )}

      {open && items.length === 0 && search.trim() && (
        <div
          className="fixed bg-surface rounded-xl border border-border shadow-lg z-[100] p-3 text-xs text-text-muted text-center"
          style={{ top: dropdownStyle.top, left: dropdownStyle.left, width: dropdownStyle.width }}
        >
          无匹配结果
        </div>
      )}
    </AnimatePresence>
  );

  return (
    <div ref={containerRef} className="relative">
      <div className="flex items-center border border-border rounded-xl bg-surface overflow-hidden focus-within:ring-1 focus-within:ring-accent">
        <input
          className="flex-1 px-3 py-2.5 text-sm bg-transparent placeholder:text-text-muted outline-none min-w-0"
          placeholder={placeholder}
          value={displayValue}
          onChange={e => { onSearchChange(e.target.value); updatePosition(); setOpen(true); }}
          onFocus={() => { updatePosition(); if (value) onSearchChange(''); setOpen(true); }}
        />
        <button
          type="button"
          onClick={() => { updatePosition(); if (value && !open) onSearchChange(''); setOpen(!open); }}
          className="px-2 text-text-muted hover:text-text-secondary"
        >
          <ChevronDown size={16} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {createPortal(<div ref={dropdownRef}>{dropdown}</div>, document.body)}
    </div>
  );
}
