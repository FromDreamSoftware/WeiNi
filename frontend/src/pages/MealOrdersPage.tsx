import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import apiClient from '../api/client';
import { useWebSocket } from '../hooks/useWebSocket';


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

const STATUS_COLOR: Record<string, string> = { PENDING: 'bg-amber-100 text-amber-700', IN_PROGRESS: 'bg-blue-100 text-blue-700', COOKING: 'bg-blue-100 text-blue-700', COMPLETED: 'bg-green-100 text-green-700', DONE: 'bg-green-100 text-green-700' };
const STATUS_CN: Record<string, string> = { PENDING: '待做', IN_PROGRESS: '已接单', COOKING: '烹饪中', COMPLETED: '已完成', DONE: '已完成' };
const MEAL_CN: Record<string, string> = { BREAKFAST: '早餐', LUNCH: '午餐', DINNER: '晚餐' };
const STATUS_STEPS = ['PENDING', 'COOKING', 'DONE'];

export default function MealOrdersPage() {
  const [orders, setOrders] = useState<MealOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [pageSize, setPageSize] = useState(12);

  useEffect(() => { loadOrders(0); }, [pageSize]);

  const loadOrders = async (pageNum: number) => {
    setLoading(true);
    try {
      const { data } = await apiClient.get<PageResponse>('/meal-orders', {
        params: { page: pageNum, size: pageSize },
      });
      setOrders(data.content);
      setPage(data.number);
      setTotalPages(data.totalPages);
      setTotalElements(data.totalElements);
    } catch { /* ignore */ } finally { setLoading(false); }
  };

  const loadOrdersRef = useRef(loadOrders);
  loadOrdersRef.current = loadOrders;

  useWebSocket(useCallback((data: any) => {
    if (data.type === 'MEAL_ORDER') loadOrdersRef.current(page);
  }, [page]));

  const updateStatus = async (id: number, status: string) => {
    try {
      await apiClient.patch(`/meal-orders/${id}?status=${status}`);
      loadOrders(page);
    } catch { /* ignore */ }
  };

  const goToPage = (p: number) => {
    if (p >= 0 && p < totalPages) loadOrders(p);
  };

  const stepIndex = (status: string) => {
    if (status === 'REJECTED') return -1;
    if (status === 'IN_PROGRESS') return STATUS_STEPS.indexOf('COOKING');
    if (status === 'COMPLETED') return STATUS_STEPS.indexOf('DONE');
    const idx = STATUS_STEPS.indexOf(status);
    return idx >= 0 ? idx : 0;
  };

  if (loading) return <div className="flex items-center justify-center py-20 text-text-muted">加载中...</div>;

  const grouped: Record<string, MealOrder[]> = {};
  orders.forEach(o => {
    const key = `${o.orderDate}|${o.mealType}`;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(o);
  });

  const sortedKeys = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

  if (sortedKeys.length === 0) {
    return (
      <>
        <h1 className="text-xl text-pink-400 mb-4">👨‍🍳 饭菜订单</h1>
        <div className="text-center text-text-muted py-12">暂无订单</div>
      </>
    );
  }

  return (
    <>
      <h1 className="text-xl text-pink-400 mb-4">👨‍🍳 饭菜订单</h1>

      {sortedKeys.map(key => {
        const [date, mt] = key.split('|');
        const group = grouped[key];

        return (
          <div key={key} className="mb-4">
            <h2 className="text-xs text-text-muted mb-2">{date} · {MEAL_CN[mt] || mt}</h2>
            {group.map(order => (
              <motion.div key={order.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="bg-surface rounded-2xl shadow-sm p-4 mb-2">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-text-primary">{order.dishName}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLOR[order.status]}`}>
                        {STATUS_CN[order.status]}
                      </span>
                    </div>
                    <p className="text-xs text-text-muted mt-0.5">点单人: {order.orderedByNickname}</p>
                    {order.notes && <p className="text-xs text-text-muted mt-0.5">备注: {order.notes}</p>}

                    {/* Status progress stepper */}
                    <div className="flex items-center gap-1 mt-3">
                      {STATUS_STEPS.map((step, i) => (
                        <div key={step} className="flex items-center flex-1 last:flex-none">
                          <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                            i <= stepIndex(order.status)
                              ? i === stepIndex(order.status) && (order.status === 'DONE' || order.status === 'COMPLETED') ? 'bg-green-400'
                                : i === stepIndex(order.status) && (order.status === 'COOKING' || order.status === 'IN_PROGRESS') ? 'bg-blue-400'
                                : 'bg-pink-400'
                              : 'bg-border'
                          }`} />
                          {i < STATUS_STEPS.length - 1 && (
                            <div className={`flex-1 h-0.5 mx-1 rounded ${
                              i < stepIndex(order.status) ? 'bg-pink-400' : 'bg-border'
                            }`} />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                {order.status !== 'DONE' && (
                  <div className="flex gap-2 mt-3">
                    {order.status === 'PENDING' && (
                      <button onClick={() => updateStatus(order.id, 'COOKING')}
                        className="flex-1 bg-blue-400 text-white rounded-lg py-1.5 text-xs hover:bg-blue-500 transition-colors">
                        开始烹饪
                      </button>
                    )}
                    {order.status === 'COOKING' && (
                      <button onClick={() => updateStatus(order.id, 'DONE')}
                        className="flex-1 bg-green-400 text-white rounded-lg py-1.5 text-xs hover:bg-green-500 transition-colors">
                        标记完成
                      </button>
                    )}
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        );
      })}

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
  );
}
