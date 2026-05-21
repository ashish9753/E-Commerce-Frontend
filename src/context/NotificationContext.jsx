import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { notificationsApi } from '../api/notifications';
import { useAuth } from './AuthContext';

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const { user } = useAuth();
  const [notifications, setNotifications]   = useState([]);
  const [unreadCount, setUnreadCount]       = useState(0);
  const [lastSupportMsg, setLastSupportMsg] = useState(null); // { ticketId, status, message }
  const [sseReconnectCount, setSseReconnect] = useState(0);   // increments on every reconnect
  const esRef = useRef(null);

  const fetchNotifications = useCallback(async () => {
    if (!user) { setNotifications([]); setUnreadCount(0); return; }
    try {
      const { data } = await notificationsApi.getMy({ limit: 50 });
      setNotifications(data.data?.data || []);
      setUnreadCount(data.data?.unreadCount ?? 0);
    } catch { /* silent */ }
  }, [user]);

  // Initial load
  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

  // SSE connection — one persistent connection, zero polling
  useEffect(() => {
    if (!user) { esRef.current?.close(); esRef.current = null; return; }

    const token = localStorage.getItem('accessToken');
    if (!token) return;

    const connect = () => {
      esRef.current?.close();
      const es = new EventSource(`/api/v1/notifications/stream?token=${encodeURIComponent(token)}`);
      esRef.current = es;

      es.onmessage = (e) => {
        try {
          const payload = JSON.parse(e.data);
          if (payload.type === 'notification') {
            setNotifications(prev => [payload.notification, ...prev]);
            setUnreadCount(prev => prev + 1);
          } else if (payload.type === 'support_message') {
            setLastSupportMsg(payload);
          }
        } catch { /* ignore malformed */ }
      };

      es.onerror = () => {
        es.close();
        setTimeout(() => {
          if (localStorage.getItem('accessToken')) {
            setSseReconnect(c => c + 1); // signal consumers to re-sync
            connect();
          }
        }, 5_000);
      };
    };

    connect();
    return () => { esRef.current?.close(); esRef.current = null; };
  }, [user]);

  const markRead = async (id) => {
    try {
      await notificationsApi.markRead(id);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch { /* silent */ }
  };

  const markAllRead = async () => {
    try {
      await notificationsApi.markAllRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch { /* silent */ }
  };

  const remove = async (id) => {
    const target = notifications.find(n => n._id === id);
    try {
      await notificationsApi.remove(id);
      setNotifications(prev => prev.filter(n => n._id !== id));
      if (target && !target.isRead) setUnreadCount(prev => Math.max(0, prev - 1));
    } catch { /* silent */ }
  };

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, fetchNotifications, markRead, markAllRead, remove, lastSupportMsg, sseReconnectCount }}>
      {children}
    </NotificationContext.Provider>
  );
}

export const useNotifications = () => useContext(NotificationContext);
