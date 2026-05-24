import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Trash2 } from 'lucide-react';
import apiClient from '../api/client';

interface SnackCategory {
  id: number;
  name: string;
}

export default function SnackCategoriesPage() {
  const [categories, setCategories] = useState<SnackCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState('');
  const [adding, setAdding] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => { loadCategories(); }, []);

  const loadCategories = async () => {
    try {
      const { data } = await apiClient.get('/snack-categories');
      setCategories(data);
    } catch { /* ignore */ } finally { setLoading(false); }
  };

  const handleAdd = async () => {
    if (!newName.trim()) return;
    setAdding(true);
    setMessage('');
    try {
      await apiClient.post('/snack-categories', { name: newName.trim() });
      setNewName('');
      loadCategories();
    } catch (e: any) {
      setMessage(e.response?.data?.detail || '添加失败');
    } finally { setAdding(false); }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`确定删除分类「${name}」吗？`)) return;
    setMessage('');
    try {
      await apiClient.delete(`/snack-categories/${id}`);
      loadCategories();
    } catch (e: any) {
      setMessage(e.response?.data?.detail || '删除失败，该分类下可能还有零食');
    }
  };

  if (loading) return <div className="flex items-center justify-center py-20 text-text-muted">加载中...</div>;

  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-xl sm:text-2xl font-semibold text-text-primary mb-4">📂 零食分类管理</h1>

      {/* Add form */}
      <div className="bg-surface rounded-2xl shadow-sm p-4 mb-4">
        <div className="flex gap-2">
          <input
            className="flex-1 border border-border rounded-xl px-3 py-2.5 text-sm bg-surface-secondary placeholder:text-text-muted outline-none focus:ring-1 focus:ring-accent"
            placeholder="新分类名称"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
          />
          <button
            onClick={handleAdd}
            disabled={adding || !newName.trim()}
            className="flex items-center gap-1 bg-accent text-white px-4 py-2.5 rounded-xl text-sm font-medium disabled:opacity-50 hover:bg-accent-hover transition-colors"
          >
            <Plus size={16} />
            添加
          </button>
        </div>
        {message && <p className="text-xs text-rose-400 mt-2">{message}</p>}
      </div>

      {/* Category list */}
      {categories.length === 0 ? (
        <div className="text-center text-text-muted py-12">暂无分类，先添加一个吧~</div>
      ) : (
        <div className="space-y-2">
          {categories.map((cat, i) => (
            <motion.div
              key={cat.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-surface rounded-xl shadow-sm px-4 py-3 flex items-center justify-between"
            >
              <span className="text-sm text-text-primary">{cat.name}</span>
              <button
                onClick={() => handleDelete(cat.id, cat.name)}
                className="p-1.5 rounded-lg text-text-muted hover:text-rose hover:bg-rose-50 transition-colors"
              >
                <Trash2 size={16} />
              </button>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
