import { useEffect, useRef, useCallback } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { useAuthStore } from '../stores/authStore';

interface NotificationData {
  id: number;
  type: string;
  title: string;
  message: string;
  relatedEntityId: number | null;
  relatedEntityType: string | null;
  isRead: boolean;
  createdAt: string;
  unreadCount: number;
}

type Listener = (data: NotificationData) => void;

interface UseWebSocketOptions {
  /** Only invoke callback for these notification types. Omit to receive all. */
  types?: string[];
}

// Singleton: shared connection + emitter pattern
let client: Client | null = null;
const listeners = new Set<Listener>();

function getToken() {
  return useAuthStore.getState().token;
}
function getUser() {
  return useAuthStore.getState().user;
}

function ensureConnected() {
  const token = getToken();
  const user = getUser();
  if (!token || !user) return;

  if (client && client.active) return;

  client = new Client({
    webSocketFactory: () => new SockJS('/ws'),
    connectHeaders: {
      Authorization: `Bearer ${token}`,
    },
    debug: () => {},
    reconnectDelay: 5000,
    heartbeatIncoming: 4000,
    heartbeatOutgoing: 4000,
  });

  client.onConnect = () => {
    client!.subscribe(`/user/${user.id}/notifications`, msg => {
      try {
        const data = JSON.parse(msg.body) as NotificationData;
        listeners.forEach(fn => fn(data));
      } catch { /* ignore */ }
    });
  };

  client.activate();
}

function deactivateIfNoListeners() {
  if (listeners.size === 0 && client) {
    client.deactivate();
    client = null;
  }
}

export function useWebSocket(onNotification: Listener, options?: UseWebSocketOptions) {
  const onNotificationRef = useRef(onNotification);
  onNotificationRef.current = onNotification;

  // Stable wrapper that filters by type, then calls the latest callback
  const stableListener = useCallback((data: NotificationData) => {
    if (options?.types && !options.types.includes(data.type)) return;
    onNotificationRef.current(data);
  }, [options?.types]);

  useEffect(() => {
    listeners.add(stableListener);
    ensureConnected();

    return () => {
      listeners.delete(stableListener);
      deactivateIfNoListeners();
    };
  }, [stableListener]);
}
