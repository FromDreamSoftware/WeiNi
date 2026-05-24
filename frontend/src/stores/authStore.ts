import { create } from 'zustand';
import apiClient from '../api/client';

interface User {
  id: number;
  username: string;
  nickname: string;
  role: 'GIRLFRIEND' | 'BOYFRIEND';
  avatarUrl: string | null;
  email: string | null;
}

function safeGetUser(): User | null {
  try { return JSON.parse(localStorage.getItem('user') || 'null'); }
  catch { return null; }
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  token: string | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  fetchMe: () => Promise<void>;
  updateProfile: (updates: { nickname?: string; email?: string }) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: safeGetUser(),
  isAuthenticated: !!localStorage.getItem('accessToken'),
  token: localStorage.getItem('accessToken'),

  login: async (username, password) => {
    const { data } = await apiClient.post('/auth/login', { username, password });
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    const user = {
      id: data.userId,
      username: data.username,
      nickname: data.nickname,
      role: data.role,
      avatarUrl: data.avatarUrl,
      email: data.email,
    };
    localStorage.setItem('user', JSON.stringify(user));
    set({ user, isAuthenticated: true, token: data.accessToken });
  },

  logout: () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    set({ user: null, isAuthenticated: false, token: null });
  },

  fetchMe: async () => {
    try {
      const { data } = await apiClient.get('/auth/me');
      localStorage.setItem('user', JSON.stringify(data));
      set({ user: data, isAuthenticated: true });
    } catch {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      set({ user: null, isAuthenticated: false, token: null });
    }
  },

  updateProfile: async (updates) => {
    const { data } = await apiClient.put('/users/me', updates);
    const current = safeGetUser() || {};
    const updated = { ...current, ...data };
    localStorage.setItem('user', JSON.stringify(updated));
    set({ user: updated as User });
  },
}));
