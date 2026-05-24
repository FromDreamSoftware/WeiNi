import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { WifiOff, ShieldX, ServerCrash, Loader2 } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import axios from 'axios';

function classifyError(e: any): { type: 'auth' | 'network' | 'server'; message: string } {
  if (axios.isAxiosError(e)) {
    if (!e.response) {
      return { type: 'network', message: '无法连接到服务器，请检查网络或后端是否启动' };
    }
    if (e.response.status === 401 || e.response.status === 403) {
      return { type: 'auth', message: e.response.data?.detail || '用户名或密码错误' };
    }
    if (e.response.status >= 500) {
      return { type: 'server', message: '服务器出了点问题，请稍后再试' };
    }
    return { type: 'auth', message: e.response.data?.detail || e.response.data?.message || '登录失败' };
  }
  return { type: 'server', message: e.message || '发生了未知错误' };
}

const errorConfig = {
  auth: { icon: ShieldX, bg: 'bg-red-50 border-red-200', text: 'text-red-600', iconColor: 'text-red-400' },
  network: { icon: WifiOff, bg: 'bg-amber-50 border-amber-200', text: 'text-amber-600', iconColor: 'text-amber-400' },
  server: { icon: ServerCrash, bg: 'bg-orange-50 border-orange-200', text: 'text-orange-600', iconColor: 'text-orange-400' },
};

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<{ type: 'auth' | 'network' | 'server'; message: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const login = useAuthStore((s) => s.login);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(username, password);
      navigate('/');
    } catch (err: any) {
      setError(classifyError(err));
    } finally {
      setLoading(false);
    }
  };

  const hasError = !!error;

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-surface-secondary">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-surface rounded-2xl shadow-sm border border-border w-full max-w-sm overflow-hidden"
      >
        {/* Header */}
        <div className="pt-8 pb-2 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-pink-50 mb-3">
            <span className="text-2xl">💕</span>
          </div>
          <h1 className="text-xl font-semibold text-text-primary">喂你</h1>
          <p className="text-xs text-text-muted mt-1">属于我们的秘密基地</p>
        </div>

        <form onSubmit={handleSubmit} className="px-6 pt-5 pb-6 space-y-4">
          {/* Username */}
          <div>
            <label className="block text-xs text-text-secondary mb-1.5 font-medium">用户名</label>
            <input
              type="text"
              value={username}
              onChange={(e) => { setUsername(e.target.value); setError(null); }}
              placeholder="请输入用户名"
              className={`w-full px-3.5 py-2.5 rounded-lg border text-sm bg-surface placeholder:text-text-muted/50
                focus:outline-none focus:ring-2 focus:ring-pink-200 focus:border-pink-300
                transition-colors ${hasError && error.type === 'auth' ? 'border-red-300' : 'border-border'}`}
              required
              autoComplete="username"
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs text-text-secondary mb-1.5 font-medium">密码</label>
            <input
              type="password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(null); }}
              placeholder="请输入密码"
              className={`w-full px-3.5 py-2.5 rounded-lg border text-sm bg-surface placeholder:text-text-muted/50
                focus:outline-none focus:ring-2 focus:ring-pink-200 focus:border-pink-300
                transition-colors ${hasError && error.type === 'auth' ? 'border-red-300' : 'border-border'}`}
              required
              autoComplete="current-password"
            />
          </div>

          {/* Error message */}
          <AnimatePresence mode="wait">
            {error && (
              <motion.div
                key="error"
                initial={{ opacity: 0, y: -8, height: 0 }}
                animate={{ opacity: 1, y: 0, height: 'auto' }}
                exit={{ opacity: 0, y: -8, height: 0 }}
                className="overflow-hidden"
              >
                <div className={`flex items-start gap-2.5 rounded-lg border px-3 py-2.5 ${errorConfig[error.type].bg}`}>
                  {(() => { const Icon = errorConfig[error.type].icon; return <Icon size={15} className={`flex-shrink-0 mt-0.5 ${errorConfig[error.type].iconColor}`} />; })()}
                  <p className={`text-xs leading-relaxed ${errorConfig[error.type].text}`}>{error.message}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Submit button */}
          <button
            type="submit"
            disabled={loading}
            className="relative w-full py-2.5 bg-pink-400 hover:bg-pink-500 active:scale-[0.98]
              text-white rounded-lg font-medium text-sm transition-all duration-200
              disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100"
          >
            <span className={`inline-flex items-center gap-2 ${loading ? 'invisible' : ''}`}>登录</span>
            {loading && (
              <span className="absolute inset-0 flex items-center justify-center">
                <Loader2 size={18} className="animate-spin" />
                <span className="ml-2 text-sm">验证中...</span>
              </span>
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="px-6 pb-5 text-center">
          <p className="text-[10px] text-text-muted/60">
            仅限两个人使用 · 我们的私人空间
          </p>
        </div>
      </motion.div>
    </div>
  );
}
