import { useState, useEffect, useCallback } from 'react';
import { api } from '../api/client.ts';

export interface KananNotification {
  id: string;
  type: 'stale_project' | 'overdue_invoice' | 'overdue_task' | 'pending_punchlist';
  title: string;
  body: string;
  href: string;
  severity: 'warn' | 'error';
}

const POLL_MS = 5 * 60 * 1000; // 5 minutos

export function useNotifications() {
  const [notifications, setNotifications] = useState<KananNotification[]>([]);
  const [count, setCount]                 = useState(0);

  const refresh = useCallback(() => {
    api.notifications.list()
      .then((d) => {
        const res = d as { count: number; notifications: KananNotification[] };
        setNotifications(res.notifications);
        setCount(res.count);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, POLL_MS);
    return () => clearInterval(id);
  }, [refresh]);

  return { notifications, count, refresh };
}
