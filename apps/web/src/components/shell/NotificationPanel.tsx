import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, AlertTriangle, AlertCircle, Inbox } from 'lucide-react';
import type { KananNotification } from '../../hooks/useNotifications.ts';

const TYPE_LABEL: Record<KananNotification['type'], string> = {
  stale_project:    'Proyecto inactivo',
  overdue_invoice:  'Factura pendiente',
  overdue_task:     'Tarea vencida',
  pending_punchlist:'Punch list abierto',
};

interface Props {
  notifications: KananNotification[];
  onClose: () => void;
  onRefresh: () => void;
}

export function NotificationPanel({ notifications, onClose, onRefresh }: Props) {
  const navigate = useNavigate();
  const ref = useRef<HTMLDivElement>(null);

  // Cerrar al hacer clic fuera
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  const handleNav = (href: string) => {
    navigate(href);
    onClose();
  };

  return (
    <div
      ref={ref}
      style={{
        position: 'fixed',
        top: 0,
        left: 220,
        bottom: 0,
        width: 320,
        background: '#161310',
        borderRight: '1px solid #2A2520',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 200,
        boxShadow: '4px 0 24px rgba(0,0,0,0.5)',
        fontFamily: "'IBM Plex Mono', monospace",
      }}
    >
      {/* Header */}
      <div style={{
        padding: '20px 20px 16px',
        borderBottom: '1px solid #2A2520',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexShrink: 0,
      }}>
        <div>
          <p style={{ fontSize: 7, letterSpacing: '0.22em', textTransform: 'uppercase', color: '#4A4540', margin: 0 }}>
            Alertas del sistema
          </p>
          <p style={{ fontSize: 12, color: '#E8DFCF', margin: '4px 0 0' }}>
            Notificaciones
            {notifications.length > 0 && (
              <span style={{ marginLeft: 8, background: '#B95D34', color: '#fff', fontSize: 8, padding: '1px 6px', borderRadius: 2 }}>
                {notifications.length}
              </span>
            )}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button
            onClick={onRefresh}
            title="Actualizar"
            style={{ background: 'none', border: 'none', color: '#4A4540', cursor: 'pointer', fontSize: 8, letterSpacing: '0.12em', textTransform: 'uppercase', padding: '4px 8px' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#A8A098')}
            onMouseLeave={e => (e.currentTarget.style.color = '#4A4540')}
          >
            ↺
          </button>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: '#4A4540', cursor: 'pointer', padding: 4, lineHeight: 0 }}
            onMouseEnter={e => (e.currentTarget.style.color = '#E8DFCF')}
            onMouseLeave={e => (e.currentTarget.style.color = '#4A4540')}
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* List */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {notifications.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 12, color: '#4A4540' }}>
            <Inbox size={32} strokeWidth={1} />
            <p style={{ fontSize: 10, margin: 0 }}>Sin alertas activas</p>
          </div>
        ) : (
          notifications.map(n => (
            <button
              key={n.id}
              onClick={() => handleNav(n.href)}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 12,
                width: '100%',
                padding: '14px 20px',
                background: 'transparent',
                border: 'none',
                borderBottom: '1px solid #1E1B17',
                cursor: 'pointer',
                textAlign: 'left',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = '#1E1B17')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <div style={{ marginTop: 1, flexShrink: 0, color: n.severity === 'error' ? '#C0392B' : '#B95D34' }}>
                {n.severity === 'error'
                  ? <AlertCircle size={14} />
                  : <AlertTriangle size={14} />
                }
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 7, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#4A4540', marginBottom: 4 }}>
                  {TYPE_LABEL[n.type]}
                </div>
                <div style={{ fontSize: 11, color: '#E8DFCF', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {n.title}
                </div>
                <div style={{ fontSize: 9, color: '#7A7068', marginTop: 3, lineHeight: 1.4 }}>
                  {n.body}
                </div>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
