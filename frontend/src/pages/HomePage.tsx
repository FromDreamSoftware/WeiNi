import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Camera, Clock, Smile, CookingPot } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import apiClient from '../api/client';
import { useWebSocket } from '../hooks/useWebSocket';
import AnniversarySection from '../components/AnniversarySection';

interface MoodData {
  moodEmoji: string;
  note: string;
}

interface PhotoItem {
  id: number;
  imageUrl: string;
  createdAt: string;
}

export default function HomePage() {
  const { user } = useAuthStore();
  const [daysTogether, setDaysTogether] = useState(0);
  const [todayMood, setTodayMood] = useState<MoodData | null>(null);
  const [pendingOrders, setPendingOrders] = useState(0);
  const [recentPhotos, setRecentPhotos] = useState<PhotoItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    Promise.all([
      loadAnniversaries(),
      loadTodayMood(),
      loadPendingOrders(),
      loadRecentPhotos(),
    ]).finally(() => setLoaded(true));
  }, []);

  const loadAnniversaries = async () => {
    try {
      const { data } = await apiClient.get('/anniversaries');
      const dating = data.find((a: any) => a.type === 'DATING');
      if (dating) {
        const start = new Date(dating.eventDate);
        const now = new Date();
        const diff = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
        setDaysTogether(Math.max(0, diff));
      }
    } catch { /* ignore */ }
  };

  const loadTodayMood = async () => {
    try {
      const { data } = await apiClient.get('/moods/today');
      if (data) setTodayMood(data);
    } catch { /* ignore */ }
  };

  const countPending = (orders: any[], type: string) => {
    if (!Array.isArray(orders)) return 0;
    const done = new Set(type === 'work' ? ['DONE', 'REJECTED'] : type === 'snack' ? ['COMPLETED', 'REJECTED'] : ['DONE', 'COMPLETED', 'REJECTED']);
    return orders.filter(o => !done.has(o.status)).length;
  };

  const loadPendingOrders = async () => {
    try {
      const view = 'pending';
      const [mealRes, snackRes, workRes] = await Promise.all([
        apiClient.get('/meal-orders', { params: { view, size: 50 } }).catch(() => ({ data: { content: [] } })),
        apiClient.get('/snack-requests', { params: { view, size: 50 } }).catch(() => ({ data: { content: [] } })),
        apiClient.get('/work-orders', { params: { view, period: 'year', size: 50 } }).catch(() => ({ data: { content: [] } })),
      ]);
      const total = countPending(mealRes.data.content || [], 'meal')
        + countPending(snackRes.data.content || [], 'snack')
        + countPending(workRes.data.content || [], 'work');
      setPendingOrders(total);
    } catch { /* ignore */ }
  };

  const loadPendingOrdersRef = useRef(loadPendingOrders);
  loadPendingOrdersRef.current = loadPendingOrders;
  useWebSocket(useCallback((data: any) => {
    if (data.type === 'MEAL_ORDER') loadPendingOrdersRef.current();
  }, []));

  const loadRecentPhotos = async () => {
    try {
      const { data: albums } = await apiClient.get('/albums');
      if (albums.length > 0) {
        const { data: photos } = await apiClient.get(`/albums/${albums[0].id}/photos?size=4`);
        setRecentPhotos(Array.isArray(photos) ? photos.slice(0, 4) : (photos.content || []).slice(0, 4));
      }
    } catch { /* ignore */ }
  };

  if (!user) return null;
  const isGirl = user.role === 'GIRLFRIEND';

  return (
    <div className="space-y-4 pb-4">
      {/* Days together */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={loaded ? { opacity: 1, y: 0 } : {}}
        className="bg-surface rounded-2xl shadow-sm p-5 text-center"
      >
        <p className="text-sm text-text-secondary">
          {user.nickname}，{isGirl ? '今天想吃什么？' : '今天做什么菜？'}
        </p>
        {daysTogether > 0 && (
          <>
            <p className="text-3xl font-bold text-accent mt-3">{daysTogether}</p>
            <p className="text-xs text-text-muted mt-1">在一起的天数</p>
          </>
        )}
      </motion.div>

      {/* Anniversary */}
      <AnniversarySection />

      {/* Today's mood + Pending orders */}
      <div className="grid grid-cols-2 gap-3">
        <Link to="/mood">
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="bg-surface rounded-2xl shadow-sm p-4 h-full"
          >
            <div className="flex items-center gap-2 mb-2">
              <Smile size={16} className="text-accent" />
              <span className="text-xs text-text-secondary">今日心情</span>
            </div>
            {todayMood ? (
              <div>
                <span className="text-3xl">{todayMood.moodEmoji}</span>
                {todayMood.note && (
                  <p className="text-xs text-text-muted mt-1 line-clamp-2">{todayMood.note}</p>
                )}
              </div>
            ) : (
              <p className="text-xs text-text-muted">今天还没打卡~</p>
            )}
          </motion.div>
        </Link>

        <Link to="/approvals">
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="bg-surface rounded-2xl shadow-sm p-4 h-full"
          >
            <div className="flex items-center gap-2 mb-2">
              <CookingPot size={16} className="text-accent" />
              <span className="text-xs text-text-secondary">未处理订单</span>
            </div>
            <p className="text-2xl font-bold text-text-primary">{pendingOrders}</p>
            <p className="text-[10px] text-text-muted mt-0.5">
              去审批页处理
            </p>
          </motion.div>
        </Link>
      </div>

      {/* Coming Soon + Photo album */}
      <div className="grid grid-cols-2 gap-3">
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="bg-surface rounded-2xl shadow-sm p-4 h-full flex flex-col items-center justify-center text-center"
        >
          <Clock size={28} className="text-text-muted mb-2" />
          <span className="text-xs text-text-muted">厨艺比拼</span>
          <span className="text-[10px] text-text-muted/60 mt-0.5">敬请期待</span>
        </motion.div>

        <Link to="/photos">
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="bg-surface rounded-2xl shadow-sm p-4 h-full"
          >
            <div className="flex items-center gap-2 mb-2">
              <Camera size={16} className="text-accent" />
              <span className="text-xs text-text-secondary">相册</span>
            </div>
            {recentPhotos.length > 0 ? (
              <div className="grid grid-cols-2 gap-1">
                {recentPhotos.map((photo, i) => (
                  <div key={photo.id || i} className="aspect-square rounded-lg overflow-hidden bg-surface-tertiary">
                    <img src={photo.imageUrl} alt="" className="w-full h-full object-cover" loading="lazy" />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-text-muted">还没照片~</p>
            )}
          </motion.div>
        </Link>
      </div>
    </div>
  );
}
