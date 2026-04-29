import { NavLink } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';

interface SidebarLinkProps {
  to: string;
  icon: LucideIcon;
  label: string;
}

const BASE: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  padding: '9px 20px',
  fontSize: 9,
  letterSpacing: '0.18em',
  textTransform: 'uppercase',
  textDecoration: 'none',
  color: '#5A5450',
  fontFamily: "'IBM Plex Mono', monospace",
  transition: 'color 0.12s, border-color 0.12s',
  borderLeft: '2px solid transparent',
  userSelect: 'none',
};

const ACTIVE: React.CSSProperties = {
  ...BASE,
  color: '#E8DFCF',
  borderLeft: '2px solid #B95D34',
};

export function SidebarLink({ to, icon: Icon, label }: SidebarLinkProps) {
  return (
    <NavLink
      to={to}
      end={to === '/'}
      style={({ isActive }) => (isActive ? ACTIVE : BASE)}
      onMouseEnter={e => {
        const el = e.currentTarget;
        if (el.getAttribute('aria-current') !== 'page') {
          el.style.color = '#A8A098';
        }
      }}
      onMouseLeave={e => {
        const el = e.currentTarget;
        if (el.getAttribute('aria-current') !== 'page') {
          el.style.color = '#5A5450';
        }
      }}
    >
      <Icon size={13} strokeWidth={1.6} />
      {label}
    </NavLink>
  );
}
