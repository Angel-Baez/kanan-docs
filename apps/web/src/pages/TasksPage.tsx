import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, CalendarClock, Clock } from 'lucide-react';
import { api } from '../api/client.ts';
import type { TaskItem } from '@kanan/shared';

const T = {
  card:    '#1E1B17',
  cardHov: '#252118',
  surface: '#161310',
  border:  '#2A2520',
  text:    '#E8DFCF',
  muted:   '#7A7068',
  dim:     '#4A4540',
  accent:  '#B95D34',
} as const;

const STATUS_CFG: Record<string, { label: string; text: string; bg: string; border: string }> = {
  'pendiente': { label: 'Pendiente', text: '#C9AA71', bg: '#C9AA7112', border: '#C9AA7135' },
  'en-curso':  { label: 'En curso',  text: '#7A9AAA', bg: '#7A9AAA12', border: '#7A9AAA35' },
  'hecho':     { label: 'Hecho',     text: '#7A8C47', bg: '#7A8C4712', border: '#7A8C4735' },
};

const STATUS_FILTERS = [
  { id: 'all',      label: 'Todas'    },
  { id: 'pendiente',label: 'Pendiente'},
  { id: 'en-curso', label: 'En curso' },
  { id: 'hecho',    label: 'Hecho'    },
];

const TYPE_LABEL: Record<string, string> = { ar: 'Acta', ot: 'OT' };

const STYLES = `
@keyframes kFadeUp { from { opacity:0;transform:translateY(6px); } to { opacity:1;transform:translateY(0); } }
.k-in { animation: kFadeUp 0.28s ease both; }
`;

function isOverdue(deadline?: string) {
  if (!deadline) return false;
  return new Date(deadline) < new Date();
}

export function TasksPage() {
  const [tasks, setTasks]               = useState<TaskItem[]>([]);
  const [loading, setLoading]           = useState(true);
  const [statusFilter, setStatusFilter] = useState('pendiente');
  const [search, setSearch]             = useState('');

  useEffect(() => {
    setLoading(true);
    const params: Record<string, string> = {};
    if (statusFilter !== 'all') params['status'] = statusFilter;
    api.tasks.list(params)
      .then(d => setTasks(d as TaskItem[]))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [statusFilter]);

  const filtered = useMemo(() => {
    if (!search.trim()) return tasks;
    const q = search.toLowerCase();
    return tasks.filter(t =>
      t.description.toLowerCase().includes(q) ||
      t.responsible.toLowerCase().includes(q) ||
      t.projectName.toLowerCase().includes(q)
    );
  }, [tasks, search]);

  // Group by project
  const grouped = useMemo(() => {
    const map = new Map<string, { projectName: string; clientName: string; items: TaskItem[] }>();
    for (const t of filtered) {
      if (!map.has(t.projectId)) map.set(t.projectId, { projectName: t.projectName, clientName: t.clientName, items: [] });
      map.get(t.projectId)!.items.push(t);
    }
    return [...map.entries()].map(([pid, v]) => ({ projectId: pid, ...v }));
  }, [filtered]);

  const total       = filtered.length;
  const pendientes  = filtered.filter(t => t.status === 'pendiente').length;
  const overdue     = filtered.filter(t => t.status === 'pendiente' && isOverdue(t.deadline)).length;

  return (
    <>
      <style>{STYLES}</style>
      <div style={{ padding: '52px 48px 80px', color: T.text, fontFamily: "'IBM Plex Mono', monospace", maxWidth: 1000 }}>

        {/* Header */}
        <div className="k-in" style={{ marginBottom: 32, animationDelay: '0ms' }}>
          <p style={{ fontSize: 8, letterSpacing: '0.26em', textTransform: 'uppercase', color: T.dim, margin: '0 0 10px' }}>
            Cross-proyecto
          </p>
          <h1 style={{ fontFamily: 'Fraunces, serif', fontStyle: 'italic', fontSize: 'clamp(36px, 4vw, 52px)', fontWeight: 400, color: T.text, lineHeight: 1.0, margin: '0 0 24px' }}>
            Tareas
          </h1>

          {/* Mini stats */}
          <div style={{ display: 'flex', gap: 20, marginBottom: 24 }}>
            {[
              { label: 'Total',      value: total,     icon: null },
              { label: 'Pendientes', value: pendientes, icon: <Clock size={10} /> },
              { label: 'Vencidas',   value: overdue,    icon: <CalendarClock size={10} />, color: overdue > 0 ? '#C4673A' : T.dim },
            ].map(s => (
              <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10 }}>
                {s.icon && <span style={{ color: s.color ?? T.dim }}>{s.icon}</span>}
                <span style={{ color: s.color ?? T.muted }}>{s.value}</span>
                <span style={{ color: T.dim, fontSize: 8, letterSpacing: '0.12em', textTransform: 'uppercase' }}>{s.label}</span>
              </div>
            ))}
          </div>

          {/* Filters row */}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
            {/* Status tabs */}
            <div style={{ display: 'flex', gap: 2, background: T.surface, border: `1px solid ${T.border}`, padding: 3 }}>
              {STATUS_FILTERS.map(f => (
                <button
                  key={f.id}
                  onClick={() => setStatusFilter(f.id)}
                  style={{
                    fontSize: 8, letterSpacing: '0.14em', textTransform: 'uppercase',
                    padding: '6px 14px', border: 'none', cursor: 'pointer',
                    fontFamily: "'IBM Plex Mono', monospace",
                    background: statusFilter === f.id ? T.accent : 'transparent',
                    color: statusFilter === f.id ? '#fff' : T.muted,
                    transition: 'all 0.12s',
                  }}
                >
                  {f.label}
                </button>
              ))}
            </div>
            {/* Search */}
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar tarea o responsable..."
              style={{
                background: T.surface, border: `1px solid ${T.border}`, color: T.text,
                padding: '7px 12px', fontSize: 11, fontFamily: "'IBM Plex Mono', monospace",
                outline: 'none', width: 240,
              }}
            />
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {[...Array(6)].map((_, i) => (
              <div key={i} style={{ height: 52, background: T.card, border: `1px solid ${T.border}`, opacity: 0.4 }} />
            ))}
          </div>
        ) : grouped.length === 0 ? (
          <p style={{ fontSize: 11, color: T.dim }}>
            {statusFilter === 'all' ? 'Sin tareas registradas.' : `Sin tareas con estado "${statusFilter}".`}
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
            {grouped.map(({ projectId, projectName, clientName, items }, gi) => (
              <div key={projectId} className="k-in" style={{ animationDelay: `${gi * 40}ms` }}>
                {/* Project header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <Link
                    to={`/projects/${projectId}`}
                    style={{ fontSize: 11, color: T.text, textDecoration: 'none', transition: 'color 0.12s' }}
                    onMouseEnter={e => (e.currentTarget.style.color = T.accent)}
                    onMouseLeave={e => (e.currentTarget.style.color = T.text)}
                  >
                    {projectName}
                  </Link>
                  <span style={{ fontSize: 9, color: T.dim }}>{clientName}</span>
                  <div style={{ flex: 1, height: 1, background: T.border }} />
                  <span style={{ fontSize: 8, color: T.dim }}>{items.length}</span>
                </div>

                {/* Task rows */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2, paddingLeft: 12 }}>
                  {items.map((task, ti) => {
                    const cfg = STATUS_CFG[task.status] ?? STATUS_CFG['pendiente']!;
                    const overdueFlag = task.status === 'pendiente' && isOverdue(task.deadline);

                    return (
                      <div
                        key={task.id}
                        className="k-in"
                        style={{
                          display: 'grid',
                          gridTemplateColumns: '1fr auto auto auto',
                          alignItems: 'center',
                          gap: 12,
                          background: T.card,
                          borderLeft: `2px solid ${overdueFlag ? '#C4673A' : cfg.text}`,
                          padding: '10px 14px',
                          animationDelay: `${gi * 40 + ti * 20}ms`,
                        }}
                      >
                        {/* Description + responsible */}
                        <div>
                          <div style={{ fontSize: 11, color: T.text, lineHeight: 1.4 }}>{task.description}</div>
                          {task.responsible && (
                            <div style={{ fontSize: 9, color: T.muted, marginTop: 2 }}>
                              {task.responsible}
                              {task.deadline && (
                                <span style={{ color: overdueFlag ? '#C4673A' : T.dim, marginLeft: 8 }}>
                                  · {task.deadline}
                                  {overdueFlag && ' ⚠'}
                                </span>
                              )}
                              {task.days && <span style={{ color: T.dim, marginLeft: 8 }}>· {task.days} días</span>}
                            </div>
                          )}
                        </div>

                        {/* Type badge */}
                        <span style={{ fontSize: 7, letterSpacing: '0.14em', color: T.dim, textTransform: 'uppercase', flexShrink: 0 }}>
                          {TYPE_LABEL[task.type] ?? task.type}
                        </span>

                        {/* Status pill */}
                        <span style={{
                          fontSize: 7, letterSpacing: '0.14em', textTransform: 'uppercase',
                          color: cfg.text, background: cfg.bg, border: `1px solid ${cfg.border}`,
                          padding: '3px 8px', flexShrink: 0,
                        }}>
                          {cfg.label}
                        </span>

                        {/* Link to source doc */}
                        <Link
                          to={`/documents/${task.docId}`}
                          title={`Abrir ${task.docTitle}`}
                          style={{ color: T.dim, display: 'flex', transition: 'color 0.12s', flexShrink: 0 }}
                          onMouseEnter={e => (e.currentTarget.style.color = T.text)}
                          onMouseLeave={e => (e.currentTarget.style.color = T.dim)}
                        >
                          <ArrowUpRight size={13} />
                        </Link>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
