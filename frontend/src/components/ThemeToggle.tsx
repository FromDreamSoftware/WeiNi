import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';

export default function ThemeToggle() {
  const { theme, toggle } = useTheme();

  return (
    <button
      onClick={toggle}
      className="p-2 rounded-full text-text-muted hover:text-accent hover:bg-surface-tertiary transition-colors"
      title={theme === 'dark' ? '切换白天模式' : '切换黑夜模式'}
    >
      {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}
