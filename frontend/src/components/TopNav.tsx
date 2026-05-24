import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, Cookie, UtensilsCrossed, Sparkles, ClipboardCheck, Wrench, Menu, X } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import NotificationBell from './NotificationBell';
import ThemeToggle from './ThemeToggle';

const SHARED_TABS = [
  { path: '/', label: '首页', icon: Home },
  { path: '/snacks', label: '零食', icon: Cookie },
  { path: '/meals', label: '点菜', icon: UtensilsCrossed },
  { path: '/wishlist', label: '愿望', icon: Sparkles },
  { path: '/approvals', label: '审批', icon: ClipboardCheck },
  { path: '/workorders', label: '工单', icon: Wrench },
];

export default function TopNav() {
  const user = useAuthStore(s => s.user);
  const logout = useAuthStore(s => s.logout);
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  if (!user) return null;

  const tabs = SHARED_TABS;

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <>
    <nav className="sticky top-0 z-40 bg-surface/90 backdrop-blur-lg border-b border-border">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-14">
        <Link to="/" className="text-lg font-semibold text-accent flex-shrink-0">
          💕 喂你
        </Link>

        {/* PC tabs */}
        <div className="hidden sm:flex items-center gap-1">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const active = isActive(tab.path);
            return (
              <Link
                key={tab.path}
                to={tab.path}
                className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  active ? 'text-accent' : 'text-text-muted hover:text-text-secondary'
                }`}
              >
                <Icon size={17} strokeWidth={active ? 2.5 : 1.5} />
                <span>{tab.label}</span>
                {active && (
                  <motion.div
                    layoutId="nav-indicator"
                    className="absolute bottom-0 left-2 right-2 h-0.5 bg-accent rounded-full"
                  />
                )}
              </Link>
            );
          })}
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-1">
          <NotificationBell />
          <ThemeToggle />
          <Link to="/profile" className="hidden sm:inline text-xs text-text-muted hover:text-accent transition-colors ml-1">
            {user.nickname}
          </Link>
          <button onClick={() => setShowLogoutModal(true)} className="hidden sm:inline text-xs text-text-muted hover:text-rose transition-colors ml-1">
            退出
          </button>

          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="sm:hidden p-2 rounded-lg text-text-muted hover:text-accent hover:bg-surface-tertiary transition-colors"
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      <AnimatePresence>
        {menuOpen && (
          <>
            <div className="sm:hidden fixed inset-0 top-14 z-30 bg-black/20" onClick={() => setMenuOpen(false)} />
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="sm:hidden absolute top-full left-0 right-0 bg-surface border-b border-border shadow-lg z-40 overflow-hidden"
            >
              <div className="px-4 py-2 space-y-1">
                {tabs.map(tab => {
                  const Icon = tab.icon;
                  const active = isActive(tab.path);
                  return (
                    <Link
                      key={tab.path}
                      to={tab.path}
                      onClick={() => setMenuOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                        active ? 'text-accent bg-accent/10' : 'text-text-secondary hover:bg-surface-secondary'
                      }`}
                    >
                      <Icon size={18} strokeWidth={active ? 2.5 : 1.5} />
                      <span>{tab.label}</span>
                    </Link>
                  );
                })}
                <div className="border-t border-border-light pt-2 mt-2 flex items-center justify-between px-3">
                  <Link to="/profile" onClick={() => setMenuOpen(false)} className="text-xs text-text-muted hover:text-accent transition-colors">
                    {user.nickname}
                  </Link>
                  <button onClick={() => setShowLogoutModal(true)} className="text-xs text-text-muted hover:text-rose transition-colors">
                    退出登录
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </nav>

    {/* Logout confirm modal */}
    <AnimatePresence>
      {showLogoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/40"
            onClick={() => setShowLogoutModal(false)}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="relative bg-surface rounded-2xl shadow-xl p-6 mx-4 w-full max-w-xs text-center"
          >
            <p className="text-sm text-text-primary mb-1">确定要退出吗？</p>
            <p className="text-xs text-text-muted mb-5">退出后需要重新登录</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLogoutModal(false)}
                className="flex-1 rounded-lg py-2 text-sm text-text-secondary bg-surface-secondary hover:bg-surface-tertiary transition-colors"
              >
                取消
              </button>
              <button
                onClick={() => { setShowLogoutModal(false); logout(); }}
                className="flex-1 rounded-lg py-2 text-sm text-white bg-red-400 hover:bg-red-500 transition-colors"
              >
                退出
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
    </>
  );
}
