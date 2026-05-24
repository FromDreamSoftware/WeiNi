import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import apiClient from '../api/client';


interface MenuItem {
  id: number;
  dishName: string;
  category: string;
  imageUrl: string;
  isActive: boolean;
  createdAt: string;
}

export default function MenuPoolPage() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [dishName, setDishName] = useState('');
  const [category, setCategory] = useState('');
  const [adding, setAdding] = useState(false);
  const [uploadingId, setUploadingId] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { loadItems(); }, []);

  const loadItems = async () => {
    try {
      const { data } = await apiClient.get('/menu-pool');
      setItems(data);
    } catch { /* ignore */ } finally { setLoading(false); }
  };

  const addItem = async () => {
    if (!dishName) return;
    setAdding(true);
    try {
      await apiClient.post('/menu-pool', { dishName, category: category || null });
      setDishName('');
      setCategory('');
      loadItems();
    } catch { /* ignore */ } finally { setAdding(false); }
  };

  const removeItem = async (id: number) => {
    try {
      await apiClient.delete(`/menu-pool/${id}`);
      loadItems();
    } catch { /* ignore */ }
  };

  const handleImageUpload = async (id: number, file: File) => {
    setUploadingId(id);
    try {
      const formData = new FormData();
      formData.append('file', file);
      await apiClient.put(`/menu-pool/${id}/image`, formData);
      loadItems();
    } catch { /* ignore */ } finally { setUploadingId(null); }
  };

  if (loading) return <div className="flex items-center justify-center py-20 text-text-muted">加载中...</div>;

  const activeItems = items.filter(i => i.isActive);
  const inactiveItems = items.filter(i => !i.isActive);

  return (
    <>
      <h1 className="text-xl text-pink-400 mb-4">📝 菜单池</h1>

      {/* Add form */}
      <motion.div className="bg-surface rounded-2xl shadow-sm p-5 mb-4">
        <div className="flex gap-2">
          <input className="flex-1 border border-border rounded-lg px-3 py-2 text-sm bg-surface"
            placeholder="菜品名称" value={dishName} onChange={e => setDishName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addItem()} />
          <input className="w-24 border border-border rounded-lg px-3 py-2 text-sm bg-surface"
            placeholder="分类" value={category} onChange={e => setCategory(e.target.value)} />
          <button onClick={addItem} disabled={adding || !dishName}
            className="bg-pink-400 text-white rounded-lg px-4 py-2 text-sm disabled:opacity-50 hover:bg-pink-500 transition-colors">
            添加
          </button>
        </div>
      </motion.div>

      {/* Hidden file input */}
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden"
        onChange={e => {
          const file = e.target.files?.[0];
          const targetId = (e.target as HTMLInputElement).dataset.itemId;
          if (file && targetId) handleImageUpload(Number(targetId), file);
          e.target.value = '';
        }} />

      {/* Active items */}
      {activeItems.length === 0 ? (
        <div className="text-center text-text-muted py-8">菜单池空空，快添加菜品吧~</div>
      ) : (
        <div className="space-y-2">
          {activeItems.map(item => (
            <motion.div key={item.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="bg-surface rounded-2xl shadow-sm p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="w-12 h-12 rounded-xl bg-surface-tertiary flex-shrink-0 overflow-hidden cursor-pointer relative group"
                  onClick={() => {
                    if (fileInputRef.current) {
                      fileInputRef.current.dataset.itemId = String(item.id);
                      fileInputRef.current.click();
                    }
                  }}
                >
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.dishName} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-text-muted text-lg">
                      {uploadingId === item.id ? (
                        <span className="animate-spin text-xs">⏳</span>
                      ) : (
                        '📷'
                      )}
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                    <span className="text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                      {uploadingId === item.id ? '上传中...' : '换图'}
                    </span>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-text-primary">{item.dishName}</p>
                  {item.category && <p className="text-xs text-text-muted">{item.category}</p>}
                </div>
              </div>
              <button onClick={() => removeItem(item.id)}
                className="text-xs text-text-muted hover:text-red-400 transition-colors">移除</button>
            </motion.div>
          ))}
        </div>
      )}

      {/* Inactive items */}
      {inactiveItems.length > 0 && (
        <div className="mt-6 pt-4 border-t border-border-light">
          <h2 className="text-xs text-text-muted mb-2">已移除</h2>
          {inactiveItems.map(item => (
            <div key={item.id} className="py-1 text-xs text-text-muted line-through">{item.dishName}</div>
          ))}
        </div>
      )}
    </>
  );
}
