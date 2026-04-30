import { type ReactNode, useState, useEffect, useCallback } from 'react';
import { Sidebar } from './Sidebar.tsx';
import { NotificationPanel } from './NotificationPanel.tsx';
import { CommandPalette } from '../search/CommandPalette.tsx';
import { useNotifications } from '../../hooks/useNotifications.ts';

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [notifOpen,   setNotifOpen]   = useState(false);
  const { notifications, count, refresh } = useNotifications();

  const openPalette = useCallback(() => { setNotifOpen(false); setPaletteOpen(true); }, []);
  const closePalette = useCallback(() => setPaletteOpen(false), []);

  // Cmd+K / Ctrl+K global shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setPaletteOpen(prev => !prev);
        setNotifOpen(false);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0F0D0B' }}>
      <Sidebar
        notifCount={count}
        notifOpen={notifOpen}
        onNotifToggle={() => { setNotifOpen(o => !o); setPaletteOpen(false); }}
        onSearchOpen={openPalette}
      />

      {notifOpen && (
        <NotificationPanel
          notifications={notifications}
          onClose={() => setNotifOpen(false)}
          onRefresh={refresh}
        />
      )}

      {paletteOpen && <CommandPalette onClose={closePalette} />}

      <main style={{ flex: 1, minWidth: 0, overflowX: 'hidden' }}>
        {children}
      </main>
    </div>
  );
}
