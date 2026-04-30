import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Mail, Phone, CreditCard, MapPin, Pencil, X, Loader2 } from 'lucide-react';
import { api } from '../api/client.ts';
import { AppNav } from '../components/nav/AppNav.tsx';
import { useToast } from '../context/ToastContext.tsx';
import type { KananClient, KananProject } from '@kanan/shared';

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

const TYPE_CFG: Record<string, { text: string; label: string }> = {
  residencial:   { text: '#C4673A', label: 'Residencial'   },
  comercial:     { text: '#7A8C47', label: 'Comercial'     },
  institucional: { text: '#C9AA71', label: 'Institucional' },
};

const STATUS_CFG: Record<string, { text: string; label: string }> = {
  cotizando:  { text: '#C9AA71', label: 'Cotizando'  },
  activo:     { text: '#7A8C47', label: 'Activo'     },
  completado: { text: '#9CAA72', label: 'Completado' },
  garantia:   { text: '#C4673A', label: 'Garantía'   },
};

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

function getInitials(name: string) {
  return name.trim().split(/\s+/).slice(0, 2).map(w => w[0] ?? '').join('').toUpperCase();
}

type ClientType = 'residencial' | 'comercial' | 'institucional';

interface EditForm {
  name: string;
  type: ClientType;
  cedula: string;
  phone: string;
  email: string;
  address1: string;
  address2: string;
}

export function ClientProfilePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [client, setClient]   = useState<KananClient | null>(null);
  const [projects, setProjects] = useState<KananProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<EditForm>({ name: '', type: 'residencial', cedula: '', phone: '', email: '', address1: '', address2: '' });
  const { addToast } = useToast();

  useEffect(() => {
    if (!id) return;
    Promise.all([api.clients.get(id), api.clients.projects(id)])
      .then(([c, p]) => {
        const cl = c as KananClient;
        setClient(cl);
        setProjects(p as KananProject[]);
        setForm({
          name: cl.name,
          type: cl.type,
          cedula: cl.cedula ?? '',
          phone: cl.phone ?? '',
          email: cl.email ?? '',
          address1: cl.address1 ?? '',
          address2: cl.address2 ?? '',
        });
      })
      .catch((err: Error) => {
        if (err.message?.includes('404') || err.message?.includes('no encontrado')) setNotFound(true);
      })
      .finally(() => setLoading(false));
  }, [id]);

  const openEdit = () => {
    if (client) setForm({
      name: client.name,
      type: client.type,
      cedula: client.cedula ?? '',
      phone: client.phone ?? '',
      email: client.email ?? '',
      address1: client.address1 ?? '',
      address2: client.address2 ?? '',
    });
    setShowEdit(true);
  };

  const handleSave = async () => {
    if (!id || !form.name.trim()) return;
    setSaving(true);
    try {
      const updated = await api.clients.update(id, form) as KananClient;
      setClient(updated);
      setShowEdit(false);
      addToast('Cliente actualizado', 'success');
    } catch {
      addToast('Error al guardar', 'error');
    } finally {
      setSaving(false);
    }
  };

  const typeCfg = client ? (TYPE_CFG[client.type] ?? { text: T.muted, label: client.type }) : null;

  return (
    <>
      <style>{STYLES}</style>
      <AppNav />

      <div style={{ background: T.bg, minHeight: '100vh', color: T.text, fontFamily: "'IBM Plex Mono', monospace" }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px 96px' }}>

          {/* ── Back ──────────────────────────────────────────────────── */}
          <div style={{ paddingTop: 40 }}>
            <button
              onClick={() => navigate(-1)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 10, color: T.muted, background: 'none', border: 'none', cursor: 'pointer', letterSpacing: '0.12em', textTransform: 'uppercase', transition: 'color 0.12s', padding: 0, fontFamily: 'inherit' }}
              onMouseEnter={e => (e.currentTarget.style.color = T.text)}
              onMouseLeave={e => (e.currentTarget.style.color = T.muted)}
            >
              <ArrowLeft size={13} />
              Volver
            </button>
          </div>

          {/* ── Loading skeleton ──────────────────────────────────────── */}
          {loading && (
            <div style={{ paddingTop: 64, display: 'flex', flexDirection: 'column', gap: 16 }}>
              {[280, 160, 220, 140].map((w, i) => (
                <div key={i} style={{ height: i === 0 ? 52 : 18, background: T.surface, width: w, borderRadius: 2, opacity: 0.45 }} />
              ))}
            </div>
          )}

          {/* ── Not found ─────────────────────────────────────────────── */}
          {notFound && !loading && (
            <p style={{ color: T.muted, fontSize: 12, paddingTop: 48, letterSpacing: '0.07em' }}>
              Cliente no encontrado.
            </p>
          )}

          {client && !loading && (
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
                {/* Faint initials watermark */}
                <div aria-hidden style={{
                  position: 'absolute', right: -12, bottom: -28,
                  fontFamily: 'Fraunces, serif', fontStyle: 'italic',
                  fontSize: 'clamp(130px, 20vw, 240px)',
                  fontWeight: 400, color: T.text,
                  opacity: 0.028, lineHeight: 1,
                  pointerEvents: 'none', userSelect: 'none',
                  letterSpacing: '-0.03em',
                }}>
                  {getInitials(client.name)}
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

                {/* Type badge + member since */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap', marginBottom: 14 }}>
                  {typeCfg && (
                    <span style={{
                      fontSize: 8, letterSpacing: '0.22em', textTransform: 'uppercase',
                      color: typeCfg.text,
                      border: `1px solid ${typeCfg.text}45`,
                      padding: '3px 11px',
                    }}>
                      {typeCfg.label}
                    </span>
                  )}
                  <span style={{ fontSize: 9, color: T.dim, letterSpacing: '0.1em' }}>
                    Cliente desde {formatDate(client.createdAt)}
                  </span>
                </div>

                {/* Name */}
                <h1 style={{
                  fontFamily: 'Fraunces, serif', fontStyle: 'italic',
                  fontSize: 'clamp(38px, 6vw, 66px)',
                  fontWeight: 400, color: T.text,
                  lineHeight: 1.0, letterSpacing: '-0.015em',
                  margin: '0 0 24px',
                }}>
                  {client.name}
                </h1>

                {/* Contact chips */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {client.phone && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 11, color: T.muted, background: T.surface, border: `1px solid ${T.border}`, padding: '5px 13px' }}>
                      <Phone size={10} style={{ color: T.dim }} />
                      {client.phone}
                    </span>
                  )}
                  {client.email && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 11, color: T.muted, background: T.surface, border: `1px solid ${T.border}`, padding: '5px 13px' }}>
                      <Mail size={10} style={{ color: T.dim }} />
                      {client.email}
                    </span>
                  )}
                  {client.cedula && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 11, color: T.muted, background: T.surface, border: `1px solid ${T.border}`, padding: '5px 13px' }}>
                      <CreditCard size={10} style={{ color: T.dim }} />
                      {client.cedula}
                    </span>
                  )}
                  {(client.address1 || (client as unknown as Record<string, string>)['address']) && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 11, color: T.muted, background: T.surface, border: `1px solid ${T.border}`, padding: '5px 13px' }}>
                      <MapPin size={10} style={{ color: T.dim }} />
                      {client.address1 ?? (client as unknown as Record<string, string>)['address']}
                      {client.address2 && `, ${client.address2}`}
                    </span>
                  )}
                </div>
              </div>

              {/* ── Projects ──────────────────────────────────────────── */}
              <div className="k-in" style={{ paddingTop: 40, animationDelay: '80ms' }}>
                <p style={{ fontSize: 8, letterSpacing: '0.26em', textTransform: 'uppercase', color: T.muted, margin: '0 0 18px' }}>
                  Proyectos · {projects.length}
                </p>

                {projects.length === 0 ? (
                  <p style={{ fontSize: 11, color: T.dim, letterSpacing: '0.07em' }}>
                    Sin proyectos registrados.
                  </p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {projects.map((p, i) => {
                      const sCfg = STATUS_CFG[p.status] ?? { text: T.muted, label: p.status };
                      return (
                        <Link
                          key={p._id}
                          to={`/projects/${p._id}`}
                          className="k-in"
                          style={{
                            display: 'flex', alignItems: 'center', gap: 18,
                            background: T.card,
                            borderLeft: `2px solid ${sCfg.text}`,
                            padding: '13px 16px',
                            textDecoration: 'none',
                            transition: 'background 0.12s',
                            animationDelay: `${90 + i * 30}ms`,
                          }}
                          onMouseEnter={e => (e.currentTarget.style.background = T.cardHov)}
                          onMouseLeave={e => (e.currentTarget.style.background = T.card)}
                        >
                          <span style={{ fontSize: 8, letterSpacing: '0.16em', textTransform: 'uppercase', color: sCfg.text, minWidth: 70, fontWeight: 700, flexShrink: 0 }}>
                            {sCfg.label}
                          </span>
                          <span style={{ flex: 1, fontSize: 12, color: T.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {p.name}
                          </span>
                          <span style={{ fontSize: 9, color: T.dim, whiteSpace: 'nowrap', flexShrink: 0 }}>
                            {formatDate(p.startDate)}
                            {p.endDate ? ` → ${formatDate(p.endDate)}` : ''}
                          </span>
                          {p.totalAmount != null && (
                            <span style={{ fontSize: 10, color: T.muted, whiteSpace: 'nowrap', flexShrink: 0 }}>
                              {formatMoney(p.totalAmount)}
                            </span>
                          )}
                          <ArrowLeft size={12} style={{ color: T.dim, transform: 'rotate(180deg)', flexShrink: 0 }} />
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* ── Historial ─────────────────────────────────────────── */}
              {client.historial?.length > 0 && (
                <div className="k-in" style={{ paddingTop: 52, animationDelay: '160ms' }}>
                  <p style={{ fontSize: 8, letterSpacing: '0.26em', textTransform: 'uppercase', color: T.muted, margin: '0 0 22px' }}>
                    Historial de cambios
                  </p>
                  <div style={{ position: 'relative', paddingLeft: 22 }}>
                    <div style={{ position: 'absolute', left: 0, top: 6, bottom: 6, width: 1, background: T.border }} />
                    {[...client.historial].reverse().map((entry, i) => (
                      <div key={i} style={{ position: 'relative', marginBottom: 22 }}>
                        <div style={{ position: 'absolute', left: -25, top: 4, width: 7, height: 7, background: T.surface, border: `1px solid ${T.border}`, borderRadius: '50%' }} />
                        <p style={{ fontSize: 9, color: T.dim, margin: '0 0 4px', letterSpacing: '0.08em' }}>
                          {formatDate(entry.fecha)}
                        </p>
                        <p style={{ fontSize: 11, color: T.muted, margin: 0, lineHeight: 1.6 }}>
                          <span style={{ color: T.text }}>{entry.campo}</span>
                          {entry.valorAnterior != null && (
                            <>
                              {' · '}
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
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* ── Edit modal ────────────────────────────────────────────────── */}
      {showEdit && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(8,6,4,0.88)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, backdropFilter: 'blur(6px)' }}
          onClick={() => !saving && setShowEdit(false)}
        >
          <div
            style={{ background: T.surface, border: `1px solid ${T.border}`, maxWidth: 520, width: '100%', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '22px 28px 18px', borderBottom: `1px solid ${T.border}` }}>
              <h2 style={{ fontFamily: 'Fraunces, serif', fontStyle: 'italic', fontSize: 20, fontWeight: 400, color: T.text, margin: 0 }}>
                Editar cliente
              </h2>
              <button onClick={() => setShowEdit(false)} style={{ color: T.muted, background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex', transition: 'color 0.12s' }}
                onMouseEnter={e => (e.currentTarget.style.color = T.text)}
                onMouseLeave={e => (e.currentTarget.style.color = T.muted)}>
                <X size={15} />
              </button>
            </div>

            {/* Form */}
            <div style={{ overflowY: 'auto', padding: '22px 28px 28px', display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Nombre */}
              <div>
                <label style={{ fontSize: 8, letterSpacing: '0.2em', textTransform: 'uppercase', color: T.muted, display: 'block', marginBottom: 6 }}>
                  Nombre *
                </label>
                <input
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  style={{ width: '100%', padding: '8px 10px', fontSize: 12, fontFamily: "'IBM Plex Mono', monospace", background: T.card, border: `1px solid ${T.border}`, color: T.text, outline: 'none', boxSizing: 'border-box' }}
                  onFocus={e => (e.currentTarget.style.borderColor = `${T.accent}60`)}
                  onBlur={e => (e.currentTarget.style.borderColor = T.border)}
                />
              </div>

              {/* Tipo */}
              <div>
                <label style={{ fontSize: 8, letterSpacing: '0.2em', textTransform: 'uppercase', color: T.muted, display: 'block', marginBottom: 6 }}>
                  Tipo
                </label>
                <div style={{ display: 'flex', gap: 6 }}>
                  {(['residencial', 'comercial', 'institucional'] as ClientType[]).map(t => (
                    <button key={t} onClick={() => setForm(f => ({ ...f, type: t }))}
                      style={{ flex: 1, padding: '7px 8px', fontSize: 8, letterSpacing: '0.12em', textTransform: 'uppercase', fontFamily: "'IBM Plex Mono', monospace", background: form.type === t ? `${T.accent}18` : 'transparent', border: `1px solid ${form.type === t ? T.accent : T.border}`, color: form.type === t ? T.accent : T.muted, cursor: 'pointer', transition: 'all 0.12s' }}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Cédula / Phone */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 8, letterSpacing: '0.2em', textTransform: 'uppercase', color: T.muted, display: 'block', marginBottom: 6 }}>
                    Cédula / RNC
                  </label>
                  <input value={form.cedula} onChange={e => setForm(f => ({ ...f, cedula: e.target.value }))}
                    style={{ width: '100%', padding: '8px 10px', fontSize: 12, fontFamily: "'IBM Plex Mono', monospace", background: T.card, border: `1px solid ${T.border}`, color: T.text, outline: 'none', boxSizing: 'border-box' }}
                    onFocus={e => (e.currentTarget.style.borderColor = `${T.accent}60`)}
                    onBlur={e => (e.currentTarget.style.borderColor = T.border)} />
                </div>
                <div>
                  <label style={{ fontSize: 8, letterSpacing: '0.2em', textTransform: 'uppercase', color: T.muted, display: 'block', marginBottom: 6 }}>
                    Teléfono
                  </label>
                  <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                    style={{ width: '100%', padding: '8px 10px', fontSize: 12, fontFamily: "'IBM Plex Mono', monospace", background: T.card, border: `1px solid ${T.border}`, color: T.text, outline: 'none', boxSizing: 'border-box' }}
                    onFocus={e => (e.currentTarget.style.borderColor = `${T.accent}60`)}
                    onBlur={e => (e.currentTarget.style.borderColor = T.border)} />
                </div>
              </div>

              {/* Email */}
              <div>
                <label style={{ fontSize: 8, letterSpacing: '0.2em', textTransform: 'uppercase', color: T.muted, display: 'block', marginBottom: 6 }}>
                  Email
                </label>
                <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  style={{ width: '100%', padding: '8px 10px', fontSize: 12, fontFamily: "'IBM Plex Mono', monospace", background: T.card, border: `1px solid ${T.border}`, color: T.text, outline: 'none', boxSizing: 'border-box' }}
                  onFocus={e => (e.currentTarget.style.borderColor = `${T.accent}60`)}
                  onBlur={e => (e.currentTarget.style.borderColor = T.border)} />
              </div>

              {/* Address */}
              <div>
                <label style={{ fontSize: 8, letterSpacing: '0.2em', textTransform: 'uppercase', color: T.muted, display: 'block', marginBottom: 6 }}>
                  Dirección línea 1
                </label>
                <input value={form.address1} onChange={e => setForm(f => ({ ...f, address1: e.target.value }))}
                  style={{ width: '100%', padding: '8px 10px', fontSize: 12, fontFamily: "'IBM Plex Mono', monospace", background: T.card, border: `1px solid ${T.border}`, color: T.text, outline: 'none', boxSizing: 'border-box' }}
                  onFocus={e => (e.currentTarget.style.borderColor = `${T.accent}60`)}
                  onBlur={e => (e.currentTarget.style.borderColor = T.border)} />
              </div>
              <div>
                <label style={{ fontSize: 8, letterSpacing: '0.2em', textTransform: 'uppercase', color: T.muted, display: 'block', marginBottom: 6 }}>
                  Dirección línea 2
                </label>
                <input value={form.address2} onChange={e => setForm(f => ({ ...f, address2: e.target.value }))}
                  style={{ width: '100%', padding: '8px 10px', fontSize: 12, fontFamily: "'IBM Plex Mono', monospace", background: T.card, border: `1px solid ${T.border}`, color: T.text, outline: 'none', boxSizing: 'border-box' }}
                  onFocus={e => (e.currentTarget.style.borderColor = `${T.accent}60`)}
                  onBlur={e => (e.currentTarget.style.borderColor = T.border)} />
              </div>
            </div>

            {/* Footer */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, padding: '14px 28px', borderTop: `1px solid ${T.border}` }}>
              <button onClick={() => setShowEdit(false)} disabled={saving}
                style={{ fontSize: 10, color: T.muted, background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'IBM Plex Mono', monospace", letterSpacing: '0.1em' }}>
                Cancelar
              </button>
              <button
                onClick={() => void handleSave()}
                disabled={saving || !form.name.trim()}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 20px', fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', fontFamily: "'IBM Plex Mono', monospace", fontWeight: 700, background: T.accent, color: '#FFF8F0', border: 'none', cursor: saving || !form.name.trim() ? 'not-allowed' : 'pointer', opacity: saving || !form.name.trim() ? 0.5 : 1, transition: 'opacity 0.12s' }}>
                {saving ? <><Loader2 size={11} className="animate-spin" />Guardando…</> : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
