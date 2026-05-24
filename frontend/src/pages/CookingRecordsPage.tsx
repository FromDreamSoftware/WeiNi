import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import apiClient from '../api/client';


interface Rating {
  id: number;
  rating: number;
  comment: string;
  raterNickname: string;
  createdAt: string;
}

interface CookingRecord {
  id: number;
  cookingDate: string;
  dishName: string;
  photoUrl: string;
  note: string;
  chefNickname: string;
  mealOrderId: number;
  createdAt: string;
  ratings: Rating[];
  averageRating: number;
}

function getUser() {
  const raw = localStorage.getItem('user');
  return raw ? JSON.parse(raw) : null;
}

export default function CookingRecordsPage() {
  const [records, setRecords] = useState<CookingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [dishName, setDishName] = useState('');
  const [cookingDate, setCookingDate] = useState(new Date().toISOString().slice(0, 10));
  const [photo, setPhoto] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [ratingId, setRatingId] = useState<number | null>(null);
  const [starVal, setStarVal] = useState(5);
  const [ratingComment, setRatingComment] = useState('');

  const user = getUser();
  const isBoy = user?.role === 'BOYFRIEND';

  useEffect(() => { loadRecords(); }, []);

  const loadRecords = async () => {
    try {
      const { data } = await apiClient.get('/cooking-records');
      setRecords(data);
    } catch { /* ignore */ } finally { setLoading(false); }
  };

  const createRecord = async () => {
    if (!dishName) return;
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('dishName', dishName);
      formData.append('cookingDate', cookingDate);
      if (photo) formData.append('photo', photo);
      await apiClient.post('/cooking-records', formData);
      setDishName('');
      setPhoto(null);
      setShowForm(false);
      loadRecords();
    } catch { /* ignore */ } finally { setSubmitting(false); }
  };

  const deleteRecord = async (id: number) => {
    try {
      await apiClient.delete(`/cooking-records/${id}`);
      loadRecords();
    } catch { /* ignore */ }
  };

  const submitRating = async (recordId: number) => {
    try {
      await apiClient.post(`/cooking-records/${recordId}/ratings`, {
        rating: starVal,
        comment: ratingComment || null,
      });
      setRatingId(null);
      setStarVal(5);
      setRatingComment('');
      loadRecords();
    } catch { /* ignore */ }
  };

  if (loading) return <div className="flex items-center justify-center py-20 text-text-muted">加载中...</div>;

  return (
    <>
      <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl text-pink-400">🏆 烹饪战绩</h1>
          {isBoy && (
            <button onClick={() => setShowForm(!showForm)}
              className="text-xs bg-pink-400 text-white px-3 py-1.5 rounded-full">
              + 晒厨艺
            </button>
          )}
        </div>

        {/* Create form */}
        {showForm && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            className="bg-surface rounded-2xl shadow-sm p-5 mb-4">
            <input className="w-full border border-border rounded-lg px-3 py-2 text-sm mb-3"
              placeholder="菜名" value={dishName} onChange={e => setDishName(e.target.value)} />
            <input type="date" className="w-full border border-border rounded-lg px-3 py-2 text-sm mb-3"
              value={cookingDate} onChange={e => setCookingDate(e.target.value)} />
            <input type="file" accept="image/*"
              onChange={e => {
                const f = e.target.files?.[0];
                if (f && f.size > 10 * 1024 * 1024) { alert('图片大小不能超过 10MB'); return; }
                setPhoto(f || null);
              }} className="text-xs mb-3 w-full" />
            <p className="text-xs text-text-muted -mt-2 mb-3">图片不超过 10MB</p>
            <button onClick={createRecord} disabled={submitting || !dishName}
              className="w-full bg-pink-400 text-white rounded-lg py-2 text-sm disabled:opacity-50">提交</button>
          </motion.div>
        )}

        {/* Records timeline */}
        {records.length === 0 ? (
          <div className="text-center text-text-muted py-12">{isBoy ? '快来晒第一道菜吧~' : '大厨还没有战绩'}</div>
        ) : (
          <div className="space-y-4">
            {records.map(record => {
              const userRating = record.ratings.find(r => r.raterNickname === user?.nickname);
              return (
                <motion.div key={record.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="bg-surface rounded-2xl shadow-sm overflow-hidden">
                  {record.photoUrl && (
                    <img src={record.photoUrl} alt={record.dishName}
                      className="w-full h-48 object-cover" />
                  )}
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-medium text-text-primary">{record.dishName}</p>
                        <p className="text-xs text-text-muted mt-0.5">
                          👨‍🍳 {record.chefNickname} · {record.cookingDate}
                        </p>
                      </div>
                      {record.averageRating > 0 && (
                        <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                          ⭐ {record.averageRating}
                        </span>
                      )}
                    </div>

                    {/* Ratings */}
                    {record.ratings.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-50 space-y-1.5">
                        {record.ratings.map(r => (
                          <div key={r.id} className="text-xs text-text-secondary">
                            <span className="text-amber-500">{'⭐'.repeat(r.rating)}</span>
                            <span className="text-text-muted ml-1">{r.raterNickname}</span>
                            {r.comment && <span>：{r.comment}</span>}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2 mt-3">
                      {!isBoy && !userRating && (
                        <>
                          {ratingId === record.id ? (
                            <div className="w-full">
                              <div className="flex gap-1 mb-2">
                                {[1, 2, 3, 4, 5].map(n => (
                                  <button key={n} onClick={() => setStarVal(n)}
                                    className={`text-lg ${n <= starVal ? 'text-amber-400' : 'text-text-muted'}`}>★</button>
                                ))}
                              </div>
                              <input className="w-full border border-border rounded-lg px-3 py-1.5 text-xs mb-2"
                                placeholder="评论（可选）" value={ratingComment}
                                onChange={e => setRatingComment(e.target.value)} />
                              <div className="flex gap-2">
                                <button onClick={() => submitRating(record.id)}
                                  className="flex-1 bg-pink-400 text-white rounded-lg py-1.5 text-xs">评分</button>
                                <button onClick={() => setRatingId(null)}
                                  className="flex-1 bg-surface-tertiary text-text-secondary rounded-lg py-1.5 text-xs hover:bg-border-light transition-colors">取消</button>
                              </div>
                            </div>
                          ) : (
                            <button onClick={() => setRatingId(record.id)}
                              className="text-xs text-pink-400 hover:text-pink-500">评分</button>
                          )}
                        </>
                      )}
                      {isBoy && (
                        <button onClick={() => deleteRecord(record.id)}
                          className="text-xs text-text-muted hover:text-red-400">删除</button>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
    </>
  );
}
