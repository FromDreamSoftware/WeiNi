import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import apiClient from '../api/client';
import { useAuthStore } from '../stores/authStore';
import { useWebSocket } from '../hooks/useWebSocket';
import ApproverSelector from '../components/ApproverSelector';

interface MenuItem {
  id: number;
  dishName: string;
  category: string;
  imageUrl: string;
  isActive: boolean;
  createdAt: string;
}

interface MealOrder {
  id: number;
  orderDate: string;
  mealType: string;
  dishName: string;
  notes: string;
  status: string;
  orderedByNickname: string;
}

interface PageResponse {
  content: MealOrder[];
  totalPages: number;
  totalElements: number;
  number: number;
  size: number;
}

const MEAL_TYPES = [
  { value: 'BREAKFAST', label: '🌅 早餐' },
  { value: 'LUNCH', label: '☀️ 午餐' },
  { value: 'DINNER', label: '🌙 晚餐' },
];

const TABS = [
  { key: 'order', label: '🍜 点菜' },
  { key: 'menu', label: '📝 菜谱管理' },
] as const;

const STATUS_CN: Record<string, string> = {
  PENDING: '待审批', IN_PROGRESS: '已接单', COOKING: '烹饪中', COMPLETED: '已完成', DONE: '已完成', REJECTED: '已拒绝',
};
const STATUS_COLOR: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-700', IN_PROGRESS: 'bg-blue-100 text-blue-700', COOKING: 'bg-blue-100 text-blue-700',
  COMPLETED: 'bg-green-100 text-green-700', DONE: 'bg-green-100 text-green-700', REJECTED: 'bg-red-100 text-red-500',
};
const STATUS_STEPS = ['PENDING', 'COOKING', 'DONE'];

export default function MealOrderPage() {
  const user = useAuthStore(s => s.user);
  const isBoy = user?.role === 'BOYFRIEND';

  const [tab, setTab] = useState<'order' | 'menu'>('order');

  // Order state
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [orders, setOrders] = useState<MealOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [pageSize, setPageSize] = useState(12);
  const [orderDate, setOrderDate] = useState(new Date().toISOString().slice(0, 10));
  const [mealType, setMealType] = useState('LUNCH');
  const [dishName, setDishName] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editDishName, setEditDishName] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [approver, setApprover] = useState<{ id: number; nickname: string; avatarUrl: string | null } | null>(null);

  // Menu pool state
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [menuLoading, setMenuLoading] = useState(true);
  const [newDishName, setNewDishName] = useState('');
  const [adding, setAdding] = useState(false);
  const [uploadingId, setUploadingId] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadMenu();
    loadOrders(0);
    loadMenuPool();
  }, []);

  useEffect(() => {
    if (totalElements > 0) loadOrders(0);
  }, [pageSize]);

  const loadMenu = async () => {
    try {
      const { data } = await apiClient.get('/menu-pool?activeOnly=true');
      setMenu(data);
    } catch { /* ignore */ }
  };

  const loadOrders = async (pageNum: number) => {
    setLoading(true);
    try {
      const { data } = await apiClient.get<PageResponse>('/meal-orders', {
        params: { page: pageNum, size: pageSize, view: 'my' },
      });
      setOrders(data.content || data);
      if (data.content) {
        setPage(data.number);
        setTotalPages(data.totalPages);
        setTotalElements(data.totalElements);
      }
    } catch { /* ignore */ } finally { setLoading(false); }
  };

  const loadOrdersRef = useRef(loadOrders);
  loadOrdersRef.current = loadOrders;

  useWebSocket(useCallback((data: any) => {
    if (data.type === 'MEAL_ORDER') loadOrdersRef.current(page);
  }, [page]));

  const loadMenuPool = async () => {
    try {
      const { data } = await apiClient.get('/menu-pool');
      setMenuItems(data);
    } catch { /* ignore */ } finally { setMenuLoading(false); }
  };

  const goToPage = (p: number) => {
    if (p >= 0 && p < totalPages) loadOrders(p);
  };

  const refreshOrders = () => loadOrders(page);

  const submitOrder = async () => {
    if (!dishName) return;
    if (!approver) { setMessage('请选择审批人'); return; }
    setSubmitting(true);
    setMessage('');
    try {
      await apiClient.post('/meal-orders', { orderDate, mealType, dishName, notes: notes || null, assigneeId: approver.id });
      setMessage('点单成功~');
      setDishName('');
      setNotes('');
      setApprover(null);
      loadOrders(0);
    } catch (e: any) {
      setMessage(e.response?.data?.detail || '点单失败');
    } finally { setSubmitting(false); }
  };

  const cancelOrder = async (id: number) => {
    try {
      await apiClient.delete(`/meal-orders/${id}`);
      refreshOrders();
    } catch { /* ignore */ }
  };

  const startEdit = (order: MealOrder) => {
    setEditingId(order.id);
    setEditDishName(order.dishName);
    setEditNotes(order.notes || '');
  };

  const saveEdit = async (id: number) => {
    try {
      await apiClient.put(`/meal-orders/${id}`, {
        dishName: editDishName,
        notes: editNotes || null,
      });
      setEditingId(null);
      refreshOrders();
    } catch { /* ignore */ }
  };

  // Menu pool actions
  const addItem = async () => {
    if (!newDishName) return;
    setAdding(true);
    try {
      await apiClient.post('/menu-pool', { dishName: newDishName });
      setNewDishName('');
      loadMenuPool();
      loadMenu();
    } catch { /* ignore */ } finally { setAdding(false); }
  };

  const removeItem = async (id: number) => {
    try {
      await apiClient.delete(`/menu-pool/${id}`);
      loadMenuPool();
      loadMenu();
    } catch { /* ignore */ }
  };

  const handleImageUpload = async (id: number, file: File) => {
    setUploadingId(id);
    try {
      const formData = new FormData();
      formData.append('file', file);
      await apiClient.put(`/menu-pool/${id}/image`, formData);
      loadMenuPool();
      loadMenu();
    } catch { /* ignore */ } finally { setUploadingId(null); }
  };

  const activeStepIndex = (status: string) => {
    if (status === 'REJECTED') return -1;
    if (status === 'IN_PROGRESS') return STATUS_STEPS.indexOf('COOKING');
    if (status === 'COMPLETED') return STATUS_STEPS.indexOf('DONE');
    const idx = STATUS_STEPS.indexOf(status);
    return idx >= 0 ? idx : 0;
  };

  return (
    <>
      {/* Tab switcher */}
      <div className="flex gap-2 mb-4">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-1.5 rounded-full text-xs font-medium transition-colors ${
              tab === t.key ? 'bg-pink-400 text-white' : 'bg-surface-tertiary text-text-secondary'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'order' ? (
        <>
          {/* Order form */}
          <motion.div className="bg-surface rounded-2xl shadow-sm p-5 mb-4">
            <div className="flex gap-2 mb-3">
              <input type="date" value={orderDate}
                className="flex-1 border border-border rounded-lg px-3 py-2 text-sm bg-surface"
                onChange={e => setOrderDate(e.target.value)} />
            </div>
            <div className="flex gap-2 mb-3">
              {MEAL_TYPES.map(mt => (
                <button key={mt.value} onClick={() => setMealType(mt.value)}
                  className={`flex-1 py-2 text-xs rounded-lg transition-colors ${mealType === mt.value ? 'bg-pink-400 text-white' : 'bg-surface-tertiary text-text-secondary'}`}>
                  {mt.label}
                </button>
              ))}
            </div>

            <div className="mb-3">
              <ApproverSelector value={approver} onChange={setApprover} />
            </div>

            <div className="flex flex-wrap gap-2 mb-3">
              {menu.map(item => (
                <button key={item.id} onClick={() => setDishName(item.dishName)}
                  className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full transition-colors ${dishName === item.dishName ? 'bg-pink-400 text-white' : 'bg-surface-tertiary text-text-secondary hover:bg-pink-100'}`}>
                  {item.imageUrl && (
                    <img src={item.imageUrl} alt="" className="w-5 h-5 rounded-full object-cover" />
                  )}
                  {item.dishName}
                </button>
              ))}
            </div>
            <input className="w-full border border-border rounded-lg px-3 py-2 text-sm mb-3 bg-surface"
              placeholder="菜品名称（可手写）" value={dishName}
              onChange={e => setDishName(e.target.value)} />
            <input className="w-full border border-border rounded-lg px-3 py-2 text-sm mb-3 bg-surface"
              placeholder="备注（可选）" value={notes}
              onChange={e => setNotes(e.target.value)} />
            {message && <p className="text-xs text-pink-400 mb-3">{message}</p>}
            <button onClick={submitOrder} disabled={submitting || !dishName}
              className="w-full bg-pink-400 text-white rounded-lg py-2 text-sm disabled:opacity-50 hover:bg-pink-500 transition-colors">
              提交点单
            </button>
          </motion.div>

          {/* My orders */}
          <h2 className="text-sm text-text-secondary mb-3">我的订单</h2>
          {loading ? (
            <div className="flex items-center justify-center py-20 text-text-muted">加载中...</div>
          ) : orders.length === 0 ? (
            <div className="text-center text-text-muted py-8">还没有点单~</div>
          ) : (
            <div className="space-y-3">
              {orders.map(order => (
                <motion.div key={order.id} layout className="bg-surface rounded-2xl shadow-sm p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-text-primary">{order.dishName}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLOR[order.status] || 'bg-surface-tertiary text-text-secondary'}`}>
                          {STATUS_CN[order.status] || order.status}
                        </span>
                      </div>
                      <p className="text-xs text-text-muted mt-0.5">
                        {order.orderDate} · {order.mealType === 'BREAKFAST' ? '早餐' : order.mealType === 'LUNCH' ? '午餐' : '晚餐'}
                      </p>

                      {/* Status stepper */}
                      <div className="flex items-center gap-1 mt-3">
                        {STATUS_STEPS.map((step, i) => (
                          <div key={step} className="flex items-center flex-1 last:flex-none">
                            <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                              i <= activeStepIndex(order.status)
                                ? i === activeStepIndex(order.status) && (order.status === 'DONE' || order.status === 'COMPLETED') ? 'bg-green-400'
                                  : i === activeStepIndex(order.status) && (order.status === 'COOKING' || order.status === 'IN_PROGRESS') ? 'bg-blue-400'
                                  : 'bg-pink-400'
                                : 'bg-border'
                            }`} />
                            {i < STATUS_STEPS.length - 1 && (
                              <div className={`flex-1 h-0.5 mx-1 rounded ${
                                i < activeStepIndex(order.status) ? 'bg-pink-400' : 'bg-border'
                              }`} />
                            )}
                          </div>
                        ))}
                      </div>

                      {order.notes && !editingId && (
                        <p className="text-xs text-text-muted mt-1.5">备注: {order.notes}</p>
                      )}

                      <AnimatePresence>
                        {editingId === order.id && (
                          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                            className="mt-3 space-y-2 overflow-hidden">
                            <input className="w-full border border-border rounded-lg px-3 py-1.5 text-xs bg-surface"
                              value={editDishName} onChange={e => setEditDishName(e.target.value)} />
                            <input className="w-full border border-border rounded-lg px-3 py-1.5 text-xs bg-surface"
                              placeholder="备注" value={editNotes} onChange={e => setEditNotes(e.target.value)} />
                            <div className="flex gap-2">
                              <button onClick={() => saveEdit(order.id)}
                                className="flex-1 bg-pink-400 text-white rounded-lg py-1.5 text-xs">保存</button>
                              <button onClick={() => setEditingId(null)}
                                className="flex-1 bg-surface-tertiary text-text-secondary rounded-lg py-1.5 text-xs">取消</button>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>

                  {order.status === 'PENDING' && editingId !== order.id && (
                    <div className="flex gap-2 mt-3">
                      <button onClick={() => startEdit(order)}
                        className="flex-1 bg-surface-tertiary text-text-secondary rounded-lg py-1.5 text-xs hover:bg-pink-100 transition-colors">
                        编辑
                      </button>
                      <button onClick={() => cancelOrder(order.id)}
                        className="flex-1 bg-rose-50 text-rose-400 rounded-lg py-1.5 text-xs hover:bg-rose-100 transition-colors">
                        取消
                      </button>
                    </div>
                  )}
                </motion.div>
              ))}
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
      ) : (
        <>
          {/* Menu Pool Tab */}
          {menuLoading ? (
            <div className="flex items-center justify-center py-20 text-text-muted">加载中...</div>
          ) : (
            <>
              {/* Add form — boyfriend only */}
              {isBoy && (
                <motion.div className="bg-surface rounded-2xl shadow-sm p-5 mb-4">
                  <div className="flex gap-2">
                    <input className="flex-1 border border-border rounded-lg px-3 py-2 text-sm bg-surface"
                      placeholder="菜品名称" value={newDishName} onChange={e => setNewDishName(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && addItem()} />
                    <button onClick={addItem} disabled={adding || !newDishName}
                      className="bg-pink-400 text-white rounded-lg px-4 py-2 text-sm disabled:opacity-50 hover:bg-pink-500 transition-colors">
                      添加
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Hidden file input */}
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden"
                onChange={e => {
                  const file = e.target.files?.[0];
                  const targetId = (e.target as HTMLInputElement).dataset.itemId;
                  if (file && targetId) handleImageUpload(Number(targetId), file);
                  e.target.value = '';
                }} />

              {menuItems.filter(i => i.isActive).length === 0 ? (
                <div className="text-center text-text-muted py-8">菜单池空空，快添加菜品吧~</div>
              ) : (
                <div className="space-y-2">
                  {menuItems.filter(i => i.isActive).map(item => (
                    <motion.div key={item.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      className="bg-surface rounded-2xl shadow-sm p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-12 h-12 rounded-xl bg-surface-tertiary flex-shrink-0 overflow-hidden relative group ${isBoy ? 'cursor-pointer' : ''}`}
                          onClick={() => {
                            if (!isBoy || !fileInputRef.current) return;
                            fileInputRef.current.dataset.itemId = String(item.id);
                            fileInputRef.current.click();
                          }}
                        >
                          {item.imageUrl ? (
                            <img src={item.imageUrl} alt={item.dishName} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-text-muted text-lg">
                              {uploadingId === item.id ? (
                                <span className="animate-spin text-xs">⏳</span>
                              ) : '📷'}
                            </div>
                          )}
                          {isBoy && (
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                              <span className="text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                                {uploadingId === item.id ? '上传中...' : '换图'}
                              </span>
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-text-primary">{item.dishName}</p>
                        </div>
                      </div>
                      {isBoy && (
                        <button onClick={() => removeItem(item.id)}
                          className="text-xs text-text-muted hover:text-red-400 transition-colors">移除</button>
                      )}
                    </motion.div>
                  ))}
                </div>
              )}

              {menuItems.filter(i => !i.isActive).length > 0 && (
                <div className="mt-6 pt-4 border-t border-border-light">
                  <h2 className="text-xs text-text-muted mb-2">已移除</h2>
                  {menuItems.filter(i => !i.isActive).map(item => (
                    <div key={item.id} className="py-1 text-xs text-text-muted line-through">{item.dishName}</div>
                  ))}
                </div>
              )}
            </>
          )}
        </>
      )}
    </>
  );
}
