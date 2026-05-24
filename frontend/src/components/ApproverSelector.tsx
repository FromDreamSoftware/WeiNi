import { useState, useEffect } from 'react';
import Combobox from './Combobox';
import apiClient from '../api/client';
import { useAuthStore } from '../stores/authStore';

interface UserInfo {
  id: number;
  nickname: string;
  avatarUrl: string | null;
}

interface ApproverSelectorProps {
  value: UserInfo | null;
  onChange: (user: UserInfo | null) => void;
  role?: string;
  placeholder?: string;
}

export default function ApproverSelector({ value, onChange, role, placeholder = '选择审批人...' }: ApproverSelectorProps) {
  const currentUser = useAuthStore(s => s.user);
  const [users, setUsers] = useState<UserInfo[]>([]);
  const [search, setSearch] = useState('');

  const targetRole = role || (currentUser?.role === 'BOYFRIEND' ? 'GIRLFRIEND' : 'BOYFRIEND');

  useEffect(() => {
    apiClient.get(`/users?role=${targetRole}`).then(({ data }) => setUsers(data)).catch(() => {});
  }, [targetRole]);

  const filtered = search.trim()
    ? users.filter(u => u.nickname.toLowerCase().includes(search.toLowerCase()))
    : users;

  return (
    <Combobox
      items={filtered}
      value={value}
      onChange={onChange}
      search={search}
      onSearchChange={setSearch}
      renderItem={(u) => (
        <div className="flex items-center gap-2">
          {u.avatarUrl ? (
            <img src={u.avatarUrl} alt="" className="w-5 h-5 rounded-full object-cover" />
          ) : (
            <span className="w-5 h-5 rounded-full bg-surface-tertiary flex items-center justify-center text-[10px]">👤</span>
          )}
          <span>{u.nickname}</span>
        </div>
      )}
      getKey={(u) => String(u.id)}
      getDisplayValue={(u) => u.nickname}
      placeholder={placeholder}
    />
  );
}

