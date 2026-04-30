import {
  LayoutDashboard,
  KanbanSquare,
  Users,
  FileText,
  CheckSquare,
  DollarSign,
  Clock,
  Settings,
  LogOut,
  Bell,
  Search,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { KananLogoNav } from '../ui/KananLogo.tsx';
import { SidebarLink } from './SidebarLink.tsx';
import { useAuth } from '../../context/AuthContext.tsx';
import type { KananNotification } from '../../hooks/useNotifications.ts';

const NAV = [
  { to: '/',          icon: LayoutDashboard, label: 'Dashboard'  },
  { to: '/projects',  icon: KanbanSquare,    label: 'Proyectos'  },
  { to: '/clients',   icon: Users,           label: 'Clientes'   },
  { to: '/documents', icon: FileText,        label: 'Documentos' },
  { to: '/tasks',     icon: CheckSquare,     label: 'Tareas'     },
  { to: '/finance',   icon: DollarSign,      label: 'Finanzas'   },
  { to: '/team',      icon: Clock,           label: 'Equipo'     },
] as const;

const ROLE_LABEL: Record<string, string> = {
  admin:      'Admin',
  jefe_obra:  'Jefe de Obra',
  vendedor:   'Vendedor',
};

interface SidebarProps {
  notifCount: number;
  notifOpen: boolean;
  onNotifToggle: () => void;
  onSearchOpen: () => void;
}

export function Sidebar({ notifCount, notifOpen, onNotifToggle, onSearchOpen }: SidebarProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <aside style={{
      width: 220,
      flexShrink: 0,
      background: '#161310',
      borderRight: '1px solid #2A2520',
      display: 'flex',
      flexDirection: 'column',
      position: 'sticky',
      top: 0,
      height: '100vh',
      overflow: 'hidden',
    }}>
      {/* Logo */}
      <Link
        to="/"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '22px 20px 20px',
          textDecoration: 'none',
          borderBottom: '1px solid #2A2520',
          flexShrink: 0,
        }}
      >
        <KananLogoNav />
        <div>
          <div style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontWeight: 700,
            fontSize: 11,
            letterSpacing: '0.22em',
            color: '#E8DFCF',
          }}>
            KANAN
          </div>
          <div style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: 7,
            letterSpacing: '0.18em',
            color: '#4A4540',
            marginTop: 1,
          }}>
            SISTEMA INTERNO
          </div>
        </div>
      </Link>

      {/* Search + Notifications strip */}
      <div style={{ padding: '8px 10px', borderBottom: '1px solid #2A2520', display: 'flex', gap: 6 }}>
        <button
          onClick={onSearchOpen}
          title="Buscar (⌘K)"
          style={{
            flex: 1, display: 'flex', alignItems: 'center', gap: 8,
            background: '#1E1B17', border: '1px solid #2A2520',
            color: '#4A4540', padding: '6px 10px', cursor: 'pointer',
            fontFamily: "'IBM Plex Mono', monospace", fontSize: 9,
            letterSpacing: '0.1em',
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = '#3A3530'; e.currentTarget.style.color = '#A8A098'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = '#2A2520'; e.currentTarget.style.color = '#4A4540'; }}
        >
          <Search size={11} />
          <span>Buscar</span>
          <span style={{ marginLeft: 'auto', fontSize: 7, opacity: 0.5 }}>⌘K</span>
        </button>

        <button
          onClick={onNotifToggle}
          title="Notificaciones"
          style={{
            position: 'relative',
            background: notifOpen ? '#252118' : '#1E1B17',
            border: `1px solid ${notifOpen ? '#3A3530' : '#2A2520'}`,
            color: notifCount > 0 ? '#B95D34' : '#4A4540',
            padding: '6px 10px', cursor: 'pointer', lineHeight: 0,
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = '#3A3530'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = notifOpen ? '#3A3530' : '#2A2520'; }}
        >
          <Bell size={13} />
          {notifCount > 0 && (
            <span style={{
              position: 'absolute', top: 3, right: 3,
              background: '#B95D34', color: '#fff',
              fontSize: 7, fontFamily: "'IBM Plex Mono', monospace",
              width: 13, height: 13, borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 700,
            }}>
              {notifCount > 9 ? '9+' : notifCount}
            </span>
          )}
        </button>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, paddingTop: 12, paddingBottom: 12, overflowY: 'auto' }}>
        {NAV.map(item => (
          <SidebarLink key={item.to} {...item} />
        ))}
      </nav>

      {/* Footer: user + settings + logout */}
      <div style={{
        padding: '12px 20px 16px',
        borderTop: '1px solid #2A2520',
        flexShrink: 0,
      }}>
        <SidebarLink to="/settings" icon={Settings} label="Config" />

        {/* User row */}
        {user && (
          <div style={{
            marginTop: 10,
            paddingTop: 10,
            borderTop: '1px solid #1E1B17',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 8,
          }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 10, color: '#A8A098', fontFamily: "'IBM Plex Mono', monospace", whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user.name}
              </div>
              <div style={{ fontSize: 7, color: '#4A4540', fontFamily: "'IBM Plex Mono', monospace", letterSpacing: '0.12em', textTransform: 'uppercase', marginTop: 2 }}>
                {ROLE_LABEL[user.role] ?? user.role}
              </div>
            </div>
            <button
              onClick={handleLogout}
              title="Cerrar sesión"
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: '#4A4540',
                padding: 4,
                display: 'flex',
                transition: 'color 0.12s',
                flexShrink: 0,
              }}
              onMouseEnter={e => (e.currentTarget.style.color = '#C4673A')}
              onMouseLeave={e => (e.currentTarget.style.color = '#4A4540')}
            >
              <LogOut size={13} />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
