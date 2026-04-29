import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, MapPin, Calendar, User, Pencil, X, Loader2 } from 'lucide-react';
import { api } from '../api/client.ts';
import { AppNav } from '../components/nav/AppNav.tsx';
import { TEMPLATE_META, PHASES } from '../templates/registry.ts';
import { useToast } from '../context/ToastContext.tsx';
import type { KananProject, KananClient, KananDocument } from '@kanan/shared';

// ── Design tokens (same system as DocumentListPage) ───────────────────────────
const T = {
  bg:      '#0F0D0B',
  surface: '#1A1714',
  card:    '#221E19',
  cardHov: '#2A2520',
  border:  '#332E28',
  text:    '#E8DFCF',
  muted:   '#7A7068',
  dim:     '#4A4540',
  accent:  '#C4673A',
} as const;

const PHASE_COLOR: Record<string, string> = {
  'pre-venta':    '#C4673A',
  'contratacion': '#7A8C47',
  'planificacion':'#C9AA71',
  'obra':         '#D4784A',
  'cierre':       '#9CAA72',
  'cobro':        '#B95D34',
  'admin':        '#7A7068',
};

interface StatusCfg { text: string; bg: string; border: string; label: string; }

const STATUS_CFG: Record<string, StatusCfg> = {
  cotizando:  { text: '#C9AA71', bg: '#C9AA7110', border: '#C9AA7135', label: 'Cotizando'  },
  activo:     { text: '#7A8C47', bg: '#7A8C4710', border: '#7A8C4735', label: 'Activo'     },
  completado: { text: '#9CAA72', bg: '#9CAA7210', border: '#9CAA7235', label: 'Completado' },
  garantia:   { text: '#C4673A', bg: '#C4673A10', border: '#C4673A35', label: 'Garantía'   },
};

const STATUS_ORDER = ['cotizando', 'activo', 'completado', 'garantia'] as const;

const STYLES = `
@keyframes kFadeUp {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}
.k-in { animation: kFadeUp 0.28s ease both; }
`;

function formatDate(iso?: string) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('es-DO', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatMoney(n?: number) {
  if (n == null) return '—';
  return new Intl.NumberFormat('es-DO', { style: 'currency', currency: 'DOP', maximumFractionDigits: 0 }).format(n);
}

type ProjectStatus = 'cotizando' | 'activo' | 'completado' | 'garantia';

interface EditForm {
  name: string;
  status: ProjectStatus;
  address1: string;
  address2: string;
  startDate: string;
  endDate: string;
  totalAmount: string;
}

export function ProjectProfilePage() {
  const { id } = useParams<{ id: string }>();
  const [project, setProject] = useState<KananProject | null>(null);
  const [client, setClient]   = useState<KananClient | null>(null);
  const [docs, setDocs]       = useState<KananDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<EditForm>({ name: '', status: 'cotizando', address1: '', address2: '', startDate: '', endDate: '', totalAmount: '' });
  const { addToast } = useToast();

  const toDateInput = (iso?: string) => iso ? iso.split('T')[0] ?? '' : '';

  useEffect(() => {
    if (!id) return;
    api.projects.get(id)
      .then(async (p) => {
        const proj = p as KananProject;
        setProject(proj);
        setForm({
          name: proj.name,
          status: proj.status as ProjectStatus,
          address1: proj.address1 ?? '',
          address2: proj.address2 ?? '',
          startDate: toDateInput(proj.startDate),
          endDate: toDateInput(proj.endDate),
          totalAmount: proj.totalAmount != null ? String(proj.totalAmount) : '',
        });
        const [docsResult, clientResult] = await Promise.allSettled([
          api.projects.documents(id),
          proj.clientId ? api.clients.get(proj.clientId) : Promise.resolve(null),
        ]);
        if (docsResult.status === 'fulfilled') setDocs(docsResult.value as KananDocument[]);
        if (clientResult.status === 'fulfilled' && clientResult.value) setClient(clientResult.value as KananClient);
      })
      .catch((err: Error) => {
        if (err.message?.includes('404') || err.message?.includes('no encontrado')) setNotFound(true);
      })
      .finally(() => setLoading(false));
  }, [id]);

  const openEdit = () => {
    if (project) setForm({
      name: project.name,
      status: project.status as ProjectStatus,
      address1: project.address1 ?? '',
      address2: project.address2 ?? '',
      startDate: toDateInput(project.startDate),
      endDate: toDateInput(project.endDate),
      totalAmount: project.totalAmount != null ? String(project.totalAmount) : '',
    });
    setShowEdit(true);
  };

  const handleSave = async () => {
    if (!id || !form.name.trim()) return;
    setSaving(true);
    try {
      const body: Record<string, unknown> = {
        name: form.name.trim(),
        status: form.status,
        address1: form.address1,
        address2: form.address2,
      };
      if (form.startDate) body['startDate'] = form.startDate;
      if (form.endDate) body['endDate'] = form.endDate;
      if (form.totalAmount !== '') body['totalAmount'] = parseFloat(form.totalAmount) || 0;
      const updated = await api.projects.update(id, body) as KananProject;
      setProject(updated);
      setShowEdit(false);
      addToast('Proyecto actualizado', 'success');
    } catch {
      addToast('Error al guardar', 'error');
    } finally {
      setSaving(false);
    }
  };

  const docsByPhase = PHASES.map(phase => ({
    phase,
    docs: docs.filter(d => TEMPLATE_META[d.templateId as keyof typeof TEMPLATE_META]?.phase === phase.id),
  })).filter(g => g.docs.length > 0);

  const sCfg: StatusCfg | null = project
    ? (STATUS_CFG[project.status] ?? { text: T.muted, bg: T.surface, border: T.border, label: project.status })
    : null;

  const currentStatusIdx = project ? STATUS_ORDER.indexOf(project.status as typeof STATUS_ORDER[number]) : -1;

  return (
    <>
      <style>{STYLES}</style>
      <AppNav />

      <div style={{ background: T.bg, minHeight: '100vh', color: T.text, fontFamily: "'IBM Plex Mono', monospace" }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px 96px' }}>

          {/* ── Back ──────────────────────────────────────────────────── */}
          <div style={{ paddingTop: 40 }}>
            <Link
              to={client ? `/clients/${project?.clientId}` : '/'}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 10, color: T.muted, textDecoration: 'none', letterSpacing: '0.12em', textTransform: 'uppercase', transition: 'color 0.12s' }}
              onMouseEnter={e => (e.currentTarget.style.color = T.text)}
              onMouseLeave={e => (e.currentTarget.style.color = T.muted)}
            >
              <ArrowLeft size={13} />
              {client ? client.name : 'Volver'}
            </Link>
          </div>

          {/* ── Loading skeleton ──────────────────────────────────────── */}
          {loading && (
            <div style={{ paddingTop: 64, display: 'flex', flexDirection: 'column', gap: 16 }}>
              {[300, 180, 240, 160].map((w, i) => (
                <div key={i} style={{ height: i === 0 ? 52 : 18, background: T.surface, width: w, borderRadius: 2, opacity: 0.45 }} />
              ))}
            </div>
          )}

          {/* ── Not found ─────────────────────────────────────────────── */}
          {notFound && !loading && (
            <p style={{ color: T.muted, fontSize: 12, paddingTop: 48, letterSpacing: '0.07em' }}>
              Proyecto no encontrado.
            </p>
          )}

          {project && sCfg && !loading && (
            <>
              {/* ── Hero ──────────────────────────────────────────────── */}
              <div
                className="k-in"
                style={{
                  paddingTop: 52, paddingBottom: 44,
                  borderBottom: `1px solid ${T.border}`,
                  position: 'relative', overflow: 'hidden',
                  animationDelay: '0ms',
                }}
              >
                {/* Faint project word watermark */}
                <div aria-hidden style={{
                  position: 'absolute', right: -8, bottom: -20,
                  fontFamily: 'Fraunces, serif', fontStyle: 'italic',
                  fontSize: 'clamp(100px, 16vw, 190px)',
                  fontWeight: 400, color: sCfg.text,
                  opacity: 0.04, lineHeight: 1,
                  pointerEvents: 'none', userSelect: 'none',
                  letterSpacing: '-0.025em',
                  whiteSpace: 'nowrap', overflow: 'hidden',
                  maxWidth: '65%',
                }}>
                  {project.name.split(/\s+/).slice(0, 2).join(' ')}
                </div>

                {/* Edit button */}
                <button
                  onClick={openEdit}
                  style={{
                    position: 'absolute', top: 52, right: 0,
                    display: 'flex', alignItems: 'center', gap: 6,
                    fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase',
                    color: T.muted, background: 'none', border: `1px solid ${T.border}`,
                    cursor: 'pointer', padding: '6px 14px',
                    fontFamily: "'IBM Plex Mono', monospace",
                    transition: 'all 0.12s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.color = T.text; e.currentTarget.style.borderColor = `${T.accent}50`; }}
                  onMouseLeave={e => { e.currentTarget.style.color = T.muted; e.currentTarget.style.borderColor = T.border; }}
                >
                  <Pencil size={10} />
                  Editar
                </button>

                {/* Status pill + client link */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 14 }}>
                  <span style={{
                    fontSize: 8, letterSpacing: '0.22em', textTransform: 'uppercase',
                    color: sCfg.text, background: sCfg.bg, border: `1px solid ${sCfg.border}`,
                    padding: '4px 12px', fontWeight: 700,
                  }}>
                    {sCfg.label}
                  </span>
                  {client && (
                    <Link
                      to={`/clients/${project.clientId}`}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 9, color: T.muted, textDecoration: 'none', letterSpacing: '0.1em', textTransform: 'uppercase', transition: 'color 0.12s' }}
                      onMouseEnter={e => (e.currentTarget.style.color = T.text)}
                      onMouseLeave={e => (e.currentTarget.style.color = T.muted)}
                    >
                      <User size={10} style={{ color: T.dim }} />
                      {client.name}
                    </Link>
                  )}
                </div>

                {/* Project name */}
                <h1 style={{
                  fontFamily: 'Fraunces, serif', fontStyle: 'italic',
                  fontSize: 'clamp(36px, 5.5vw, 62px)',
                  fontWeight: 400, color: T.text,
                  lineHeight: 1.0, letterSpacing: '-0.015em',
                  margin: '0 0 24px',
                }}>
                  {project.name}
                </h1>

                {/* Info chips */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 28 }}>
                  {(project.address1 || (project as unknown as Record<string, string>)['address']) && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 11, color: T.muted, background: T.surface, border: `1px solid ${T.border}`, padding: '5px 13px' }}>
                      <MapPin size={10} style={{ color: T.dim }} />
                      {project.address1 ?? (project as unknown as Record<string, string>)['address']}
                      {project.address2 && `, ${project.address2}`}
                    </span>
                  )}
                  <span style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 11, color: T.muted, background: T.surface, border: `1px solid ${T.border}`, padding: '5px 13px' }}>
                    <Calendar size={10} style={{ color: T.dim }} />
                    {formatDate(project.startDate)}
                    {project.endDate && ` → ${formatDate(project.endDate)}`}
                  </span>
                  {project.totalAmount != null && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 11, color: T.muted, background: T.surface, border: `1px solid ${T.border}`, padding: '5px 13px' }}>
                      <span style={{ fontSize: 8, color: T.dim }}>DOP</span>
                      {formatMoney(project.totalAmount)}
                    </span>
                  )}
                </div>

                {/* ── Status lifecycle track ───────────────────────────── */}
                <div style={{ display: 'flex', alignItems: 'center', maxWidth: 520 }}>
                  {STATUS_ORDER.map((s, i) => {
                    const cfg = STATUS_CFG[s]!;
                    const isCurrent  = i === currentStatusIdx;
                    const isPast     = i < currentStatusIdx;
                    const isLast     = i === STATUS_ORDER.length - 1;
                    return (
                      <div key={s} style={{ display: 'flex', alignItems: 'center', flex: isLast ? 'none' : 1 }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                          <div style={{
                            width:  isCurrent ? 10 : isPast ? 7 : 6,
                            height: isCurrent ? 10 : isPast ? 7 : 6,
                            borderRadius: '50%',
                            background: isCurrent ? cfg.text : isPast ? `${cfg.text}55` : T.dim,
                            boxShadow: isCurrent ? `0 0 10px ${cfg.text}55` : 'none',
                            transition: 'all 0.2s',
                          }} />
                          <span style={{
                            fontSize: 7, letterSpacing: '0.12em', textTransform: 'uppercase',
                            color: isCurrent ? cfg.text : isPast ? `${cfg.text}70` : T.dim,
                            whiteSpace: 'nowrap',
                          }}>
                            {cfg.label}
                          </span>
                        </div>
                        {!isLast && (
                          <div style={{
                            flex: 1,
                            height: 1,
                            background: isPast ? `${T.muted}45` : T.border,
                            margin: '0 8px 18px',
                          }} />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ── Documents by phase ────────────────────────────────── */}
              <div className="k-in" style={{ paddingTop: 40, animationDelay: '80ms' }}>
                <p style={{ fontSize: 8, letterSpacing: '0.26em', textTransform: 'uppercase', color: T.muted, margin: '0 0 22px' }}>
                  Documentos · {docs.length}
                </p>

                {docs.length === 0 ? (
                  <p style={{ fontSize: 11, color: T.dim, letterSpacing: '0.07em' }}>
                    Sin documentos registrados.
                  </p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
                    {docsByPhase.map(({ phase, docs: phaseDocs }, phaseIdx) => {
                      const phaseColor = PHASE_COLOR[phase.id] ?? T.accent;
                      return (
                        <div key={phase.id}>
                          {/* Phase label */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                            <span style={{ width: 3, height: 12, background: phaseColor, borderRadius: 1, flexShrink: 0 }} />
                            <span style={{ fontSize: 8, letterSpacing: '0.2em', textTransform: 'uppercase', color: phaseColor, fontWeight: 700 }}>
                              {phase.label}
                            </span>
                            <div style={{ flex: 1, borderTop: `1px solid ${T.border}` }} />
                          </div>
                          {/* Doc rows */}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 1, paddingLeft: 13 }}>
                            {phaseDocs.map((doc, docIdx) => {
                              const meta = TEMPLATE_META[doc.templateId as keyof typeof TEMPLATE_META];
                              return (
                                <Link
                                  key={doc._id}
                                  to={`/documents/${doc._id}`}
                                  className="k-in"
                                  style={{
                                    display: 'flex', alignItems: 'center', gap: 12,
                                    background: T.card,
                                    borderLeft: `2px solid ${phaseColor}`,
                                    padding: '11px 14px',
                                    textDecoration: 'none',
                                    transition: 'background 0.12s',
                                    animationDelay: `${120 + phaseIdx * 40 + docIdx * 25}ms`,
                                  }}
                                  onMouseEnter={e => (e.currentTarget.style.background = T.cardHov)}
                                  onMouseLeave={e => (e.currentTarget.style.background = T.card)}
                                >
                                  <span style={{ fontSize: 8, letterSpacing: '0.14em', textTransform: 'uppercase', color: phaseColor, fontWeight: 700, minWidth: 30, flexShrink: 0 }}>
                                    {meta?.label ?? doc.templateId.toUpperCase()}
                                  </span>
                                  <span style={{ flex: 1, fontSize: 11, color: T.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {doc.title}
                                  </span>
                                  <span style={{ fontSize: 9, color: T.dim, flexShrink: 0 }}>
                                    {formatDate(doc.createdAt)}
                                  </span>
                                  <ArrowLeft size={11} style={{ color: T.dim, transform: 'rotate(180deg)', flexShrink: 0 }} />
                                </Link>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* ── Historial ─────────────────────────────────────────── */}
              <div className="k-in" style={{ paddingTop: 52, animationDelay: '160ms' }}>
                <p style={{ fontSize: 8, letterSpacing: '0.26em', textTransform: 'uppercase', color: T.muted, margin: '0 0 22px' }}>
                  Historial de estado
                </p>
                {(!project.historial || project.historial.length === 0) ? (
                  <p style={{ fontSize: 11, color: T.dim, letterSpacing: '0.07em' }}>
                    Sin cambios desde la creación.
                  </p>
                ) : (
                  <div style={{ position: 'relative', paddingLeft: 22 }}>
                    <div style={{ position: 'absolute', left: 0, top: 6, bottom: 6, width: 1, background: T.border }} />
                    {[...project.historial].reverse().map((entry, i) => {
                      const prevCfg = STATUS_CFG[entry.valorAnterior];
                      const nextCfg = STATUS_CFG[entry.valorNuevo];
                      return (
                        <div key={i} style={{ position: 'relative', marginBottom: 22 }}>
                          <div style={{ position: 'absolute', left: -25, top: 4, width: 7, height: 7, background: T.surface, border: `1px solid ${T.border}`, borderRadius: '50%' }} />
                          <p style={{ fontSize: 9, color: T.dim, margin: '0 0 4px', letterSpacing: '0.08em' }}>
                            {formatDate(entry.fecha)}
                          </p>
                          <p style={{ fontSize: 11, color: T.muted, margin: 0, lineHeight: 1.6 }}>
                            {entry.campo === 'status' && prevCfg && nextCfg ? (
                              <>
                                Estado:{' '}
                                <span style={{ color: prevCfg.text, textDecoration: 'line-through' }}>{prevCfg.label}</span>
                                {' → '}
                                <span style={{ color: nextCfg.text }}>{nextCfg.label}</span>
                              </>
                            ) : (
                              <>
                                <span style={{ color: T.text }}>{entry.campo}</span>
                                {': '}
                                <span style={{ textDecoration: 'line-through', color: T.dim }}>{entry.valorAnterior}</span>
                                {' → '}
                                <span style={{ color: T.text }}>{entry.valorNuevo}</span>
                              </>
                            )}
                            {entry.nota && (
                              <span style={{ color: T.dim }}> — {entry.nota}</span>
                            )}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Edit modal ────────────────────────────────────────────────── */}
      {showEdit && (
        <div
          onClick={() => setShowEdit(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 400,
            background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 24,
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: '#1A1714', border: `1px solid #332E28`,
              width: '100%', maxWidth: 480,
              fontFamily: "'IBM Plex Mono', monospace",
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 24px', borderBottom: '1px solid #332E28' }}>
              <span style={{ fontSize: 9, letterSpacing: '0.22em', textTransform: 'uppercase', color: '#7A7068' }}>
                Editar proyecto
              </span>
              <button onClick={() => setShowEdit(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#7A7068', display: 'flex', padding: 0 }}>
                <X size={15} />
              </button>
            </div>

            {/* Fields */}
            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: 18 }}>
              {/* Name */}
              <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span style={{ fontSize: 8, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#7A7068' }}>Nombre *</span>
                <input
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  style={{ background: '#221E19', border: '1px solid #332E28', color: '#E8DFCF', padding: '9px 12px', fontSize: 12, fontFamily: "'IBM Plex Mono', monospace", outline: 'none' }}
                />
              </label>

              {/* Status */}
              <div>
                <span style={{ fontSize: 8, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#7A7068', display: 'block', marginBottom: 8 }}>Estado</span>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {STATUS_ORDER.map(s => {
                    const cfg = STATUS_CFG[s]!;
                    const active = form.status === s;
                    return (
                      <button
                        key={s}
                        onClick={() => setForm(f => ({ ...f, status: s }))}
                        style={{
                          fontSize: 8, letterSpacing: '0.16em', textTransform: 'uppercase',
                          padding: '6px 14px', cursor: 'pointer',
                          fontFamily: "'IBM Plex Mono', monospace",
                          background: active ? cfg.bg : 'transparent',
                          color: active ? cfg.text : '#4A4540',
                          border: `1px solid ${active ? cfg.border : '#332E28'}`,
                          transition: 'all 0.12s',
                        }}
                      >
                        {cfg.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Address */}
              <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span style={{ fontSize: 8, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#7A7068' }}>Dirección línea 1</span>
                <input
                  value={form.address1}
                  onChange={e => setForm(f => ({ ...f, address1: e.target.value }))}
                  placeholder="Calle, sector..."
                  style={{ background: '#221E19', border: '1px solid #332E28', color: '#E8DFCF', padding: '9px 12px', fontSize: 12, fontFamily: "'IBM Plex Mono', monospace", outline: 'none' }}
                />
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span style={{ fontSize: 8, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#7A7068' }}>Dirección línea 2</span>
                <input
                  value={form.address2}
                  onChange={e => setForm(f => ({ ...f, address2: e.target.value }))}
                  placeholder="Ciudad, provincia..."
                  style={{ background: '#221E19', border: '1px solid #332E28', color: '#E8DFCF', padding: '9px 12px', fontSize: 12, fontFamily: "'IBM Plex Mono', monospace", outline: 'none' }}
                />
              </label>

              {/* Dates */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <span style={{ fontSize: 8, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#7A7068' }}>Fecha inicio</span>
                  <input
                    type="date"
                    value={form.startDate}
                    onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))}
                    style={{ background: '#221E19', border: '1px solid #332E28', color: '#E8DFCF', padding: '9px 12px', fontSize: 12, fontFamily: "'IBM Plex Mono', monospace", outline: 'none', colorScheme: 'dark' }}
                  />
                </label>
                <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <span style={{ fontSize: 8, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#7A7068' }}>Fecha fin</span>
                  <input
                    type="date"
                    value={form.endDate}
                    onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))}
                    style={{ background: '#221E19', border: '1px solid #332E28', color: '#E8DFCF', padding: '9px 12px', fontSize: 12, fontFamily: "'IBM Plex Mono', monospace", outline: 'none', colorScheme: 'dark' }}
                  />
                </label>
              </div>

              {/* Total amount */}
              <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span style={{ fontSize: 8, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#7A7068' }}>Monto total (DOP)</span>
                <input
                  type="number"
                  value={form.totalAmount}
                  onChange={e => setForm(f => ({ ...f, totalAmount: e.target.value }))}
                  placeholder="0"
                  style={{ background: '#221E19', border: '1px solid #332E28', color: '#E8DFCF', padding: '9px 12px', fontSize: 12, fontFamily: "'IBM Plex Mono', monospace", outline: 'none' }}
                />
              </label>
            </div>

            {/* Footer */}
            <div style={{ padding: '0 24px 24px', display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowEdit(false)}
                style={{ fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', padding: '9px 20px', background: 'none', border: '1px solid #332E28', color: '#7A7068', cursor: 'pointer', fontFamily: "'IBM Plex Mono', monospace" }}
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !form.name.trim()}
                style={{ fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', padding: '9px 20px', background: saving ? '#332E28' : '#C4673A', border: 'none', color: saving ? '#7A7068' : '#fff', cursor: saving ? 'default' : 'pointer', fontFamily: "'IBM Plex Mono', monospace", display: 'flex', alignItems: 'center', gap: 7 }}
              >
                {saving && <Loader2 size={11} style={{ animation: 'spin 1s linear infinite' }} />}
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
