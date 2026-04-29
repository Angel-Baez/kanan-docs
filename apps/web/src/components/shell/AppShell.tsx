import type { ReactNode } from 'react';
import { Sidebar } from './Sidebar.tsx';

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      background: '#0F0D0B',
    }}>
      <Sidebar />
      <main style={{ flex: 1, minWidth: 0, overflowX: 'hidden' }}>
        {children}
      </main>
    </div>
  );
}
