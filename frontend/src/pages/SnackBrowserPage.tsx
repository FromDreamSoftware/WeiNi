import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, ImageIcon } from 'lucide-react';
import apiClient from '../api/client';
import Combobox from '../components/Combobox';
import PillTabs from '../components/PillTabs';
import ConsumeSnackModal from '../components/ConsumeSnackModal';
import Modal from '../components/Modal';
import ApproverSelector from '../components/ApproverSelector';
import { useWebSocket } from '../hooks/useWebSocket';

interface Snack {
  id: number;
  name: string;
  category: string;
  imageUrl: string;
  stock: number;
  status: string;
}

interface SnackCategory {
  id: number;
  name: string;
}

interface SnackRequest {
  id: number;
  type: string;
  snackName: string;
  categoryName: string;
  count: number;
  reason: string;
  status: string;
  requesterNickname: string;
  handlerNickname: string;
  createdAt: string;
  resolvedAt: string;
}

const MAX_STOCK = 20;

const REQ_STATUS_COLOR: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-700',
  IN_PROGRESS: 'bg-blue-100 text-blue-700',
  COMPLETED: 'bg-green-100 text-green-700',
  REJECTED: 'bg-red-100 text-red-500'
};
const REQ_STATUS_CN: Record<string, string> = {
  PENDING: '未接受',
  IN_PROGRESS: '进行中',
  COMPLETED: '完成',
  REJECTED: '拒绝'
};
const REQ_TYPE_CN: Record<string, string> = { RESTOCK: '补货', ADD: '新增', REMOVE: '下架' };

export default function SnackBrowserPage() {
  const [snacks, setSnacks] = useState<Snack[]>([]);
  const [categories, setCategories] = useState<SnackCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [requestType, setRequestType] = useState<'RESTOCK' | 'REMOVE' | 'ADD'>('RESTOCK');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  // RESTOCK / REMOVE form state
  const [selectedCat, setSelectedCat] = useState<SnackCategory | null>(null);
  const [catSearch, setCatSearch] = useState('');
  const [selectedSnack, setSelectedSnack] = useState<Snack | null>(null);
  const [snackSearch, setSnackSearch] = useState('');
  const [orderCount, setOrderCount] = useState(1);

  // ADD form state
  const [addMode, setAddMode] = useState<'new' | 'existing'>('existing');
  const [newCatName, setNewCatName] = useState('');
  const [addCat, setAddCat] = useState<SnackCategory | null>(null);
  const [addCatSearch, setAddCatSearch] = useState('');
  const [newSnackName, setNewSnackName] = useState('');
  const [newStock, setNewStock] = useState(1);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Tab & progress state
  const [activeTab, setActiveTab] = useState<'browse' | 'progress'>('browse');
  const [myRequests, setMyRequests] = useState<SnackRequest[]>([]);
  const [consumeTarget, setConsumeTarget] = useState<Snack | null>(null);
  const [approver, setApprover] = useState<{ id: number; nickname: string; avatarUrl: string | null } | null>(null);

  // "想吃" modal state
  const [wantTarget, setWantTarget] = useState<Snack | null>(null);
  const [wantCount, setWantCount] = useState(1);
  const [wantApprover, setWantApprover] = useState<{ id: number; nickname: string; avatarUrl: string | null } | null>(null);

  useEffect(() => {
    Promise.all([loadSnacks(), loadCategories()]).finally(() => setLoading(false));
  }, []);

  const loadSnacks = async () => {
    try {
      const { data } = await apiClient.get('/snacks');
      setSnacks(data);
    } catch { /* ignore */ }
  };

  const loadCategories = async () => {
    try {
      const { data } = await apiClient.get('/snack-categories');
      setCategories(data);
    } catch { /* ignore */ }
  };

  const loadMyRequests = async () => {
    try {
      const { data } = await apiClient.get('/snack-requests');
      setMyRequests(data.content || data);
    } catch { /* ignore */ }
  };

  useEffect(() => {
    if (activeTab === 'progress' && myRequests.length === 0) {
      loadMyRequests();
    }
  }, [activeTab]);

  const loadMyRequestsRef = useRef(loadMyRequests);
  loadMyRequestsRef.current = loadMyRequests;

  useWebSocket(useCallback(() => { loadMyRequestsRef.current(); }, []), { types: ['SNACK_REQUEST'] });

  const filteredSnacks = snacks
    .filter(s => !selectedCategory || s.category === selectedCategory)
    .filter(s => !search.trim() || s.name.toLowerCase().includes(search.toLowerCase()));

  const getStockColor = (stock: number) => {
    if (stock === 0) return 'bg-red-400';
    if (stock <= 3) return 'bg-amber-400';
    return 'bg-green-400';
  };

  // Filter snacks by selected category (for RESTOCK/REMOVE)
  const snacksByCategory = selectedCat
    ? snacks.filter(s => s.category === selectedCat.name && (requestType !== 'REMOVE' || s.status === 'AVAILABLE'))
    : [];
  const filteredSnacksByCat = snacksByCategory.filter(s =>
    !snackSearch.trim() || s.name.toLowerCase().includes(snackSearch.toLowerCase())
  );

  const filteredCategories = categories.filter(c =>
    !catSearch.trim() || c.name.toLowerCase().includes(catSearch.toLowerCase())
  );

  const filteredAddCategories = categories.filter(c =>
    !addCatSearch.trim() || c.name.toLowerCase().includes(addCatSearch.toLowerCase())
  );

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (imagePreview) URL.revokeObjectURL(imagePreview);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const resetForm = () => {
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setSelectedCat(null); setCatSearch(''); setSelectedSnack(null); setSnackSearch('');
    setOrderCount(1); setAddMode('existing'); setNewCatName(''); setAddCat(null);
    setAddCatSearch(''); setNewSnackName(''); setNewStock(1);
    setImagePreview(null);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setMessage('');
    try {
      const body: any = { type: requestType, count: requestType === 'REMOVE' ? 1 : orderCount };

      if (requestType === 'RESTOCK' || requestType === 'REMOVE') {
        if (!selectedSnack) { setMessage('请选择零食'); setSubmitting(false); return; }
        body.snackId = selectedSnack.id;
        body.snackName = selectedSnack.name;
      }

      if (requestType === 'ADD') {
        const name = newSnackName.trim();
        if (!name) { setMessage('请输入零食名称'); setSubmitting(false); return; }
        body.snackName = name;
        body.count = newStock;
        body.categoryName = addMode === 'new' ? newCatName.trim() : addCat?.name;
        if (!body.categoryName) { setMessage('请选择或输入分类'); setSubmitting(false); return; }
      }

      if (!approver) { setMessage('请选择审批人'); setSubmitting(false); return; }
      body.assigneeId = approver.id;

      if (requestType === 'RESTOCK') {
        body.reason = `补货 ${orderCount} 个`;
      }

      await apiClient.post('/snack-requests', body);

      // If ADD with image, upload image after snack is created (via request approval)
      // The image is uploaded to the snack after boyfriend approves, but we can pre-upload
      // For now, the image upload happens when boyfriend approves the ADD request

      setMessage('请求已提交~');
      setShowForm(false);
      resetForm();
      loadSnacks();
    } catch (e: any) {
      setMessage(e.response?.data?.detail || '提交失败');
    } finally { setSubmitting(false); }
  };

  const handleQuickWant = (snack: Snack) => {
    setWantTarget(snack);
    setWantCount(1);
    setWantApprover(null);
  };

  const handleConfirmWant = async () => {
    if (!wantTarget || !wantApprover) return;
    setSubmitting(true);
    try {
      await apiClient.post('/snack-requests', {
        type: 'RESTOCK',
        snackId: wantTarget.id,
        snackName: wantTarget.name,
        count: wantCount,
        reason: '想吃',
        assigneeId: wantApprover.id,
      });
      setMessage(`已提交「想吃 ${wantTarget.name}」请求~`);
      setTimeout(() => setMessage(''), 2000);
      setWantTarget(null);
    } catch { /* ignore */ } finally { setSubmitting(false); }
  };

  if (loading) return <div className="flex items-center justify-center py-20 text-text-muted">加载中...</div>;

  const allCategories = [...new Set(snacks.map(s => s.category))];

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl sm:text-2xl font-semibold text-text-primary">🍪 零食饮料</h1>
        {activeTab === 'browse' && (
          <button
            onClick={() => { resetForm(); setShowForm(!showForm); }}
            className="flex items-center gap-1 text-xs bg-accent text-white px-3 py-1.5 rounded-full hover:bg-accent-hover transition-colors"
          >
            <Plus size={14} />
            发起请求
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="mb-4">
        <PillTabs
          tabs={[
            { value: 'browse', label: '🍪 零食浏览' },
            { value: 'progress', label: '📋 请求进度' },
          ]}
          active={activeTab}
          onChange={(v) => setActiveTab(v as 'browse' | 'progress')}
        />
      </div>

      {activeTab === 'browse' && (
      <>
      {/* Search bar */}
      <div className="mb-3">
        <input
          className="w-full border border-border rounded-xl px-4 py-2.5 text-sm bg-surface placeholder:text-text-muted outline-none focus:ring-1 focus:ring-accent"
          placeholder="🔍 搜索零食..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Category filter */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
        <button
          onClick={() => setSelectedCategory(null)}
          className={`px-3 py-1 rounded-full text-xs whitespace-nowrap transition-colors ${!selectedCategory ? 'bg-accent text-white' : 'bg-surface-tertiary text-text-secondary'}`}
        >
          全部
        </button>
        {allCategories.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1 rounded-full text-xs whitespace-nowrap transition-colors ${selectedCategory === cat ? 'bg-accent text-white' : 'bg-surface-tertiary text-text-secondary'}`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Toast message */}
      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-3 bg-accent/10 text-accent border border-accent/20 rounded-xl px-4 py-2 text-sm"
          >
            {message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Request form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-surface rounded-2xl shadow-md border border-card-border/30 p-5 mb-4 overflow-hidden"
          >
            <h2 className="text-sm font-medium text-text-secondary mb-4">发起请求</h2>

            {/* Type selector */}
            <div className="flex gap-2 mb-4">
              {(['RESTOCK', 'REMOVE', 'ADD'] as const).map(t => (
                <button
                  key={t}
                  onClick={() => { setRequestType(t); resetForm(); }}
                  className={`flex-1 py-2 rounded-lg text-xs font-medium transition-colors ${
                    requestType === t ? 'bg-accent text-white' : 'bg-surface-tertiary text-text-secondary'
                  }`}
                >
                  {{ RESTOCK: '补货', REMOVE: '下架', ADD: '新增' }[t]}
                </button>
              ))}
            </div>

            {/* Approver selector */}
            <div className="mb-4">
              <ApproverSelector value={approver} onChange={setApprover} />
            </div>

            {/* RESTOCK form */}
            {requestType === 'RESTOCK' && (
              <div className="space-y-3">
                <Combobox
                  items={filteredCategories}
                  value={selectedCat}
                  onChange={setSelectedCat}
                  search={catSearch}
                  onSearchChange={setCatSearch}
                  renderItem={c => <span>{c.name}</span>}
                  getKey={c => String(c.id)}
                  getDisplayValue={c => c.name}
                  placeholder="选择分类..."
                />
                {selectedCat && (
                  <Combobox
                    items={filteredSnacksByCat}
                    value={selectedSnack}
                    onChange={setSelectedSnack}
                    search={snackSearch}
                    onSearchChange={setSnackSearch}
                    renderItem={s => (
                      <div className="flex items-center justify-between">
                        <span>{s.name}</span>
                        <span className="text-xs text-text-muted">库存 {s.stock}</span>
                      </div>
                    )}
                    getKey={s => String(s.id)}
                    getDisplayValue={s => s.name}
                    placeholder="选择零食..."
                  />
                )}
                {selectedSnack && (
                  <div>
                    <label className="text-xs text-text-muted mb-1 block">补货数量</label>
                    <input
                      type="number"
                      min={1}
                      max={99}
                      value={orderCount}
                      onChange={e => setOrderCount(parseInt(e.target.value) || 1)}
                      className="w-full border border-border rounded-xl px-3 py-2.5 text-sm bg-surface outline-none focus:ring-1 focus:ring-accent"
                    />
                    <p className="text-xs text-text-muted mt-1">
                      当前库存: {selectedSnack.stock} → 补货后: {selectedSnack.stock + orderCount}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* REMOVE form */}
            {requestType === 'REMOVE' && (
              <div className="space-y-3">
                <Combobox
                  items={filteredCategories}
                  value={selectedCat}
                  onChange={setSelectedCat}
                  search={catSearch}
                  onSearchChange={setCatSearch}
                  renderItem={c => <span>{c.name}</span>}
                  getKey={c => String(c.id)}
                  getDisplayValue={c => c.name}
                  placeholder="选择分类..."
                />
                {selectedCat && (
                  <Combobox
                    items={filteredSnacksByCat}
                    value={selectedSnack}
                    onChange={setSelectedSnack}
                    search={snackSearch}
                    onSearchChange={setSnackSearch}
                    renderItem={s => (
                      <div className="flex items-center justify-between">
                        <span>{s.name}</span>
                        <span className="text-xs text-text-muted">库存 {s.stock}</span>
                      </div>
                    )}
                    getKey={s => String(s.id)}
                    getDisplayValue={s => s.name}
                    placeholder="选择要下架的零食..."
                  />
                )}
                {selectedSnack && (
                  <div className="bg-rose-50 rounded-xl p-3 text-xs text-rose-600">
                    确认下架「{selectedSnack.name}」？下架后可在零食管理中重新上架。
                  </div>
                )}
              </div>
            )}

            {/* ADD form */}
            {requestType === 'ADD' && (
              <div className="space-y-3">
                <div className="flex gap-2">
                  <button
                    onClick={() => setAddMode('existing')}
                    className={`flex-1 py-2 rounded-lg text-xs font-medium transition-colors ${
                      addMode === 'existing' ? 'bg-accent text-white' : 'bg-surface-tertiary text-text-secondary'
                    }`}
                  >
                    已有分类
                  </button>
                  <button
                    onClick={() => setAddMode('new')}
                    className={`flex-1 py-2 rounded-lg text-xs font-medium transition-colors ${
                      addMode === 'new' ? 'bg-accent text-white' : 'bg-surface-tertiary text-text-secondary'
                    }`}
                  >
                    新建分类
                  </button>
                </div>

                {addMode === 'existing' ? (
                  <Combobox
                    items={filteredAddCategories}
                    value={addCat}
                    onChange={setAddCat}
                    search={addCatSearch}
                    onSearchChange={setAddCatSearch}
                    renderItem={c => <span>{c.name}</span>}
                    getKey={c => String(c.id)}
                    getDisplayValue={c => c.name}
                    placeholder="选择分类..."
                  />
                ) : (
                  <input
                    className="w-full border border-border rounded-xl px-3 py-2.5 text-sm bg-surface outline-none focus:ring-1 focus:ring-accent"
                    placeholder="新分类名称"
                    value={newCatName}
                    onChange={e => setNewCatName(e.target.value)}
                  />
                )}

                <input
                  className="w-full border border-border rounded-xl px-3 py-2.5 text-sm bg-surface outline-none focus:ring-1 focus:ring-accent"
                  placeholder="零食名称"
                  value={newSnackName}
                  onChange={e => setNewSnackName(e.target.value)}
                />

                <div>
                  <label className="text-xs text-text-muted mb-1 block">初始库存</label>
                  <input
                    type="number"
                    min={0}
                    max={99}
                    value={newStock}
                    onChange={e => setNewStock(parseInt(e.target.value) || 0)}
                    className="w-full border border-border rounded-xl px-3 py-2.5 text-sm bg-surface outline-none focus:ring-1 focus:ring-accent"
                  />
                </div>

                {/* Image upload */}
                <div>
                  <label className="text-xs text-text-muted mb-1 block">零食图片（可选）</label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageSelect}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full border-2 border-dashed border-border rounded-xl p-4 text-xs text-text-muted hover:border-accent hover:text-accent transition-colors"
                  >
                    {imagePreview ? (
                      <div className="flex items-center gap-3">
                        <img src={imagePreview} alt="" className="w-10 h-10 rounded-lg object-cover" />
                        <span>点击更换图片</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-2">
                        <ImageIcon size={16} />
                        <span>点击上传图片</span>
                      </div>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Submit / Cancel */}
            <div className="flex gap-2 mt-4">
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="flex-1 bg-accent text-white rounded-xl py-2.5 text-sm font-medium disabled:opacity-50 hover:bg-accent-hover transition-colors"
              >
                {submitting ? '提交中...' : '提交请求'}
              </button>
              <button
                onClick={() => setShowForm(false)}
                className="flex-1 bg-surface-tertiary text-text-secondary rounded-xl py-2.5 text-sm"
              >
                取消
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Snack grid */}
      {filteredSnacks.length === 0 ? (
        <div className="text-center text-text-muted py-12">
          {search.trim() ? '没有找到匹配的零食~' : '还没有零食，快让男朋友补货吧~'}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {filteredSnacks.map(snack => (
            <motion.div
              key={snack.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={`bg-surface rounded-2xl shadow-md border border-card-border/30 overflow-hidden group ${snack.status === 'UNAVAILABLE' ? 'opacity-50' : ''}`}
            >
              <div className="h-0.5 bg-gradient-to-r from-accent to-accent/30" />
              {/* Image */}
              <div className="relative w-full aspect-square bg-surface-tertiary flex items-center justify-center overflow-hidden">
                {snack.imageUrl ? (
                  <img src={snack.imageUrl} alt={snack.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                ) : (
                  <span className="text-4xl">🍪</span>
                )}
                {snack.status === 'AVAILABLE' && (
                  <button
                    onClick={() => handleQuickWant(snack)}
                    className="absolute bottom-2 right-2 bg-white/90 backdrop-blur text-accent text-xs px-2.5 py-1 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-accent hover:text-white"
                  >
                    想吃
                  </button>
                )}
                {snack.status === 'UNAVAILABLE' && (
                  <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                    <span className="text-white text-xs font-medium bg-black/50 px-2 py-1 rounded-full">已下架</span>
                  </div>
                )}
              </div>

              <div className="p-3">
                <p className="text-sm font-medium text-text-primary truncate">{snack.name}</p>
                <span className="inline-block text-[10px] text-text-muted bg-surface-tertiary px-1.5 py-0.5 rounded mt-1">
                  {snack.category}
                </span>

                {/* Consume button */}
                {snack.status === 'AVAILABLE' && snack.stock > 0 && (
                  <button
                    onClick={(e) => { e.stopPropagation(); setConsumeTarget(snack); }}
                    className="w-full mt-2 text-xs py-1.5 rounded-lg bg-accent/10 text-accent hover:bg-accent hover:text-white transition-colors"
                  >
                    吃了
                  </button>
                )}

                {/* Stock bar */}
                <div className="mt-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-xs font-medium ${snack.stock > 0 ? 'text-text-secondary' : 'text-red-400'}`}>
                      库存 {snack.stock}
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-surface-tertiary rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${getStockColor(snack.stock)}`}
                      style={{ width: `${Math.min((snack.stock / MAX_STOCK) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
      </>
      )}

      {/* Progress tab */}
      {activeTab === 'progress' && (
        <ProgressView
          requests={myRequests}
          statusColor={REQ_STATUS_COLOR}
          statusCn={REQ_STATUS_CN}
          typeCn={REQ_TYPE_CN}
        />
      )}

      {/* Want modal */}
      <Modal isOpen={!!wantTarget} onClose={() => setWantTarget(null)} title="想吃" size="sm">
        {wantTarget && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-surface-tertiary flex items-center justify-center text-2xl">
                {wantTarget.imageUrl ? (
                  <img src={wantTarget.imageUrl} alt="" className="w-full h-full rounded-xl object-cover" />
                ) : '🍪'}
              </div>
              <div>
                <p className="text-sm font-medium text-text-primary">{wantTarget.name}</p>
                <p className="text-xs text-text-muted">当前库存: {wantTarget.stock}</p>
              </div>
            </div>

            <ApproverSelector value={wantApprover} onChange={setWantApprover} />

            <div>
              <label className="text-xs text-text-muted mb-1 block">想吃数量</label>
              <input
                type="number"
                min={1}
                max={99}
                value={wantCount}
                onChange={e => setWantCount(parseInt(e.target.value) || 1)}
                className="w-full border border-border rounded-xl px-3 py-2.5 text-sm bg-surface outline-none focus:ring-1 focus:ring-accent"
              />
            </div>

            <button
              onClick={handleConfirmWant}
              disabled={submitting || !wantApprover}
              className="w-full bg-accent text-white rounded-xl py-2.5 text-sm font-medium disabled:opacity-50 hover:bg-accent-hover transition-colors"
            >
              {submitting ? '提交中...' : '真想吃 🍽️'}
            </button>
          </div>
        )}
      </Modal>

      {/* Consume modal */}
      <ConsumeSnackModal
        isOpen={!!consumeTarget}
        onClose={() => setConsumeTarget(null)}
        snack={consumeTarget ? { id: consumeTarget.id, name: consumeTarget.name, stock: consumeTarget.stock } : { id: 0, name: '', stock: 0 }}
        onConsumed={(snackId, newStock) => {
          setSnacks(prev => prev.map(s =>
            s.id === snackId ? { ...s, stock: newStock, status: newStock === 0 ? 'UNAVAILABLE' : s.status } : s
          ));
        }}
      />
    </>
  );
}

function ProgressView({
  requests,
  statusColor,
  statusCn,
  typeCn,
}: {
  requests: SnackRequest[];
  statusColor: Record<string, string>;
  statusCn: Record<string, string>;
  typeCn: Record<string, string>;
}) {
  const active = requests.filter(r =>
    (r.type === 'ADD' || r.type === 'RESTOCK') && (r.status === 'PENDING' || r.status === 'IN_PROGRESS')
  );
  const done = requests.filter(r =>
    (r.type === 'ADD' || r.type === 'RESTOCK') && (r.status === 'COMPLETED' || r.status === 'REJECTED')
  );

  if (requests.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-text-muted text-sm">暂无请求记录</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {active.length > 0 && (
        <div>
          <h2 className="text-sm font-medium text-text-secondary mb-3">进行中 ({active.length})</h2>
          <div className="space-y-3">
            {active.map(req => (
              <motion.div
                key={req.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-surface rounded-2xl shadow-md border border-card-border/30 p-4"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${statusColor[req.status] || 'bg-surface-tertiary text-text-secondary'}`}>
                      {statusCn[req.status] || req.status}
                    </span>
                    <span className="text-xs text-text-muted">{typeCn[req.type] || req.type}</span>
                  </div>
                  <span className="text-[10px] text-text-muted">
                    {req.createdAt?.slice(0, 16).replace('T', ' ')}
                  </span>
                </div>
                <p className="text-sm font-medium text-text-primary">{req.snackName}</p>
                <div className="text-xs text-text-muted mt-1">
                  {req.type === 'RESTOCK' && <span>补货数量: +{req.count}</span>}
                  {req.type === 'ADD' && (
                    <span>初始库存: {req.count} | 分类: {req.categoryName || '其他'}</span>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {done.length > 0 && (
        <div>
          <h2 className="text-sm font-medium text-text-secondary mb-3">已完成</h2>
          <div className="space-y-2 opacity-70">
            {done.map(req => (
              <div key={req.id} className="bg-surface rounded-xl shadow-sm border border-card-border/30 px-4 py-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${statusColor[req.status] || ''}`}>
                      {statusCn[req.status] || req.status}
                    </span>
                    <span className="text-xs text-text-muted">{typeCn[req.type]}</span>
                    <span className="text-sm text-text-secondary">{req.snackName}</span>
                    {req.count > 1 && <span className="text-xs text-text-muted">x{req.count}</span>}
                  </div>
                  {req.handlerNickname && (
                    <span className="text-[10px] text-text-muted">{req.handlerNickname} 处理</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {active.length === 0 && done.length === 0 && (
        <div className="text-center text-text-muted py-12">暂无请求</div>
      )}
    </div>
  );
}
