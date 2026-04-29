import {
  LayoutDashboard,
  KanbanSquare,
  Users,
  FileText,
  CheckSquare,
  DollarSign,
  Clock,
  Settings,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { KananLogoNav } from '../ui/KananLogo.tsx';
import { SidebarLink } from './SidebarLink.tsx';

const NAV = [
  { to: '/',          icon: LayoutDashboard, label: 'Dashboard'  },
  { to: '/projects',  icon: KanbanSquare,    label: 'Proyectos'  },
  { to: '/clients',   icon: Users,           label: 'Clientes'   },
  { to: '/documents', icon: FileText,        label: 'Documentos' },
  { to: '/tasks',     icon: CheckSquare,     label: 'Tareas'     },
  { to: '/finance',   icon: DollarSign,      label: 'Finanzas'   },
  { to: '/team',      icon: Clock,           label: 'Equipo'     },
] as const;

export function Sidebar() {
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

      {/* Nav */}
      <nav style={{ flex: 1, paddingTop: 12, paddingBottom: 12, overflowY: 'auto' }}>
        {NAV.map(item => (
          <SidebarLink key={item.to} {...item} />
        ))}
      </nav>

      {/* Footer */}
      <div style={{
        padding: '14px 20px',
        borderTop: '1px solid #2A2520',
        flexShrink: 0,
      }}>
        <SidebarLink to="/settings" icon={Settings} label="Config" />
      </div>
    </aside>
  );
}
