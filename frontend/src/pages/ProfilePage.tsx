import { useState } from 'react';
import { useAuthStore } from '../stores/authStore';

export default function ProfilePage() {
  const user = useAuthStore(s => s.user);
  const updateProfile = useAuthStore(s => s.updateProfile);

  const [nickname, setNickname] = useState(user?.nickname || '');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  const save = async () => {
    if (!nickname.trim()) return;
    setSaving(true);
    setMsg('');
    try {
      await updateProfile({ nickname: nickname.trim() });
      setMsg('保存成功~');
    } catch {
      setMsg('保存失败');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <h1 className="text-xl sm:text-2xl font-semibold text-text-primary mb-4">个人设置</h1>

      <div className="bg-surface rounded-2xl shadow-sm p-6 max-w-md">
        <div className="space-y-4">
          <div>
            <label className="text-xs text-text-muted block mb-1">用户名</label>
            <input
              className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-surface-tertiary text-text-muted"
              value={user?.username || ''}
              disabled
            />
          </div>

          <div>
            <label className="text-xs text-text-muted block mb-1">角色</label>
            <input
              className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-surface-tertiary text-text-muted"
              value={user?.role === 'GIRLFRIEND' ? '女朋友' : '男朋友'}
              disabled
            />
          </div>

          <div>
            <label className="text-xs text-text-muted block mb-1">昵称</label>
            <input
              className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-surface"
              value={nickname}
              onChange={e => setNickname(e.target.value)}
            />
          </div>
        </div>

        {msg && (
          <p className={`text-xs mt-3 ${msg.includes('失败') ? 'text-red-400' : 'text-green-500'}`}>
            {msg}
          </p>
        )}

        <button
          onClick={save}
          disabled={saving || !nickname.trim()}
          className="w-full mt-4 bg-pink-400 text-white rounded-lg py-2 text-sm disabled:opacity-50 hover:bg-pink-500 transition-colors"
        >
          {saving ? '保存中...' : '保存'}
        </button>
      </div>
    </>
  );
}
