import { useEffect, useState, useMemo } from 'react';
import { UserCircle2, Plus, X, Pencil } from 'lucide-react';
import { api } from '../api/client.ts';

const T = {
  card:    '#1E1B17',
  surface: '#161310',
  border:  '#2A2520',
  text:    '#E8DFCF',
  muted:   '#7A7068',
  dim:     '#4A4540',
  accent:  '#B95D34',
  green:   '#7A8C47',
} as const;

const STYLES = `
@keyframes kFadeUp { from { opacity:0;transform:translateY(6px); } to { opacity:1;transform:translateY(0); } }
.k-in { animation: kFadeUp 0.28s ease both; }
`;

function fmt(n: number) {
  if (n === 0) return '—';
  return new Intl.NumberFormat('es-DO', { style: 'currency', currency: 'DOP', maximumFractionDigits: 0 }).format(n);
}

function currentYM() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

interface StaffMember {
  _id: string;
  name: string;
  role: string;
  cedula?: string;
  phone?: string;
  dailyRate: number;
  isActive: boolean;
}

interface PayrollRow {
  name: string;
  role: string;
  totalDays: number;
  dailyRate: number;
  total: number;
  projectCount: number;
}

interface PayrollSummary {
  month: string;
  rows: PayrollRow[];
  grandTotal: number;
  workerCount: number;
  htDocCount: number;
}

// ── Staff Modal (create OR edit) ─────────────────────────────────────────────
function StaffModal({
  initial,
  onClose,
  onSaved,
}: {
  initial?: StaffMember;
  onClose: () => void;
  onSaved: (s: StaffMember) => void;
}) {
  const isEdit = !!initial;
  const [name,      setName]      = useState(initial?.name      ?? '');
  const [role,      setRole]      = useState(initial?.role      ?? '');
  const [cedula,    setCedula]    = useState(initial?.cedula    ?? '');
  const [phone,     setPhone]     = useState(initial?.phone     ?? '');
  const [dailyRate, setDailyRate] = useState(initial ? String(initial.dailyRate) : '');
  const [saving,    setSaving]    = useState(false);

  const inputStyle: React.CSSProperties = {
    width: '100%', boxSizing: 'border-box',
    background: T.surface, border: `1px solid ${T.border}`,
    color: T.text, padding: '8px 10px',
    fontSize: 11, fontFamily: "'IBM Plex Mono', monospace", outline: 'none',
  };

  const save = async () => {
    if (!name.trim() || !role.trim()) return;
    setSaving(true);
    try {
      const payload = { name: name.trim(), role: role.trim(), cedula: cedula.trim(), phone: phone.trim(), dailyRate: parseFloat(dailyRate) || 0 };
      const s = isEdit
        ? await api.staff.patch(initial!._id, payload) as StaffMember
        : await api.staff.create(payload) as StaffMember;
      onSaved(s);
    } finally { setSaving(false); }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: T.card, border: `1px solid ${T.border}`, padding: '28px 24px', width: 360, fontFamily: "'IBM Plex Mono', monospace" }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <p style={{ fontSize: 8, letterSpacing: '0.2em', textTransform: 'uppercase', color: T.dim, margin: 0 }}>
            {isEdit ? 'Editar miembro' : 'Nuevo miembro'}
          </p>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: T.dim, cursor: 'pointer' }}><X size={14} /></button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[
            { label: 'Nombre completo *', value: name,   set: setName,   placeholder: 'Carlos Polanco' },
            { label: 'Cargo / Rol *',     value: role,   set: setRole,   placeholder: 'Técnico Principal' },
            { label: 'Cédula',            value: cedula, set: setCedula, placeholder: '001-0000000-0' },
            { label: 'Teléfono',          value: phone,  set: setPhone,  placeholder: '809-000-0000' },
          ].map(f => (
            <div key={f.label}>
              <label style={{ fontSize: 8, letterSpacing: '0.14em', textTransform: 'uppercase', color: T.muted, display: 'block', marginBottom: 5 }}>{f.label}</label>
              <input value={f.value} onChange={e => f.set(e.target.value)} placeholder={f.placeholder} style={inputStyle} />
            </div>
          ))}
          <div>
            <label style={{ fontSize: 8, letterSpacing: '0.14em', textTransform: 'uppercase', color: T.muted, display: 'block', marginBottom: 5 }}>Tarifa diaria (RD$)</label>
            <input value={dailyRate} onChange={e => setDailyRate(e.target.value)} placeholder="3500" type="number" style={inputStyle} />
          </div>
        </div>
        <button
          onClick={save}
          disabled={saving || !name.trim() || !role.trim()}
          style={{ marginTop: 20, width: '100%', background: (!name.trim() || !role.trim()) ? T.border : T.accent, color: '#fff', border: 'none', padding: '10px', fontSize: 9, letterSpacing: '0.16em', textTransform: 'uppercase', fontFamily: "'IBM Plex Mono', monospace", cursor: 'pointer' }}
        >
          {saving ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Crear miembro'}
        </button>
      </div>
    </div>
  );
}

// ── Staff Card ───────────────────────────────────────────────────────────────
function StaffCard({ member, onToggle, onEdit }: { member: StaffMember; onToggle: () => void; onEdit: () => void }) {
  const initials = member.name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
  return (
    <div className="k-in" style={{ background: T.card, border: `1px solid ${T.border}`, padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 36, height: 36, borderRadius: '50%', background: `${T.accent}22`, border: `1px solid ${T.accent}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: T.accent, fontFamily: "'IBM Plex Mono', monospace", fontWeight: 700, flexShrink: 0 }}>
          {initials || <UserCircle2 size={18} />}
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontSize: 12, color: T.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{member.name}</div>
          <div style={{ fontSize: 9, color: T.muted, marginTop: 2 }}>{member.role}</div>
        </div>
        <button
          onClick={onEdit}
          title="Editar"
          style={{ background: 'none', border: 'none', color: T.dim, cursor: 'pointer', padding: 4, flexShrink: 0, lineHeight: 0 }}
          onMouseEnter={e => (e.currentTarget.style.color = T.text)}
          onMouseLeave={e => (e.currentTarget.style.color = T.dim)}
        >
          <Pencil size={12} />
        </button>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 10 }}>
        <span style={{ color: T.dim }}>{fmt(member.dailyRate)}<span style={{ fontSize: 7, color: T.dim }}> / día</span></span>
        <button
          onClick={onToggle}
          title={member.isActive ? 'Desactivar' : 'Activar'}
          style={{ background: member.isActive ? `${T.green}18` : `${T.dim}18`, border: `1px solid ${member.isActive ? T.green : T.dim}44`, color: member.isActive ? T.green : T.dim, padding: '3px 8px', fontSize: 7, letterSpacing: '0.12em', textTransform: 'uppercase', fontFamily: "'IBM Plex Mono', monospace", cursor: 'pointer' }}
        >
          {member.isActive ? 'Activo' : 'Inactivo'}
        </button>
      </div>
      {(member.phone || member.cedula) && (
        <div style={{ fontSize: 8, color: T.dim, borderTop: `1px solid ${T.border}`, paddingTop: 8 }}>
          {member.phone  && <div>📞 {member.phone}</div>}
          {member.cedula && <div>🪪 {member.cedula}</div>}
        </div>
      )}
    </div>
  );
}

// ── Payroll Tab ──────────────────────────────────────────────────────────────
function PayrollTab() {
  const [month, setMonth]         = useState(currentYM());
  const [data, setData]           = useState<PayrollSummary | null>(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    api.payroll.summary(month)
      .then(d => { setData(d as PayrollSummary); setError(null); })
      .catch((e: unknown) => {
        console.error('[PayrollTab] Error:', e);
        setData(null);
        setError(e instanceof Error ? e.message : 'Error al cargar nómina');
      })
      .finally(() => setLoading(false));
  }, [month]);

  const monthLabel = useMemo(() => {
    const [y, m] = month.split('-');
    const date = new Date(Number(y), Number(m) - 1, 1);
    return date.toLocaleDateString('es-DO', { month: 'long', year: 'numeric' });
  }, [month]);

  return (
    <div>
      {/* Month selector */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
        <input
          type="month"
          value={month}
          onChange={e => setMonth(e.target.value)}
          style={{ background: T.surface, border: `1px solid ${T.border}`, color: T.text, padding: '7px 10px', fontSize: 11, fontFamily: "'IBM Plex Mono', monospace", outline: 'none', colorScheme: 'dark' }}
        />
        <span style={{ fontSize: 8, color: T.dim }}>mes activo: {month || '(vacío)'}</span>
        <span style={{ fontSize: 9, color: T.dim, textTransform: 'capitalize' }}>{monthLabel}</span>
      </div>

      {loading ? (
        <div style={{ color: T.dim, fontSize: 10 }}>Cargando nómina...</div>
      ) : error ? (
        <p style={{ fontSize: 11, color: '#C0392B' }}>⚠ {error}</p>
      ) : !data || data.rows.length === 0 ? (
        <p style={{ fontSize: 11, color: T.dim }}>Sin registros de Hojas de Tiempo para este mes.</p>
      ) : (
        <>
          {/* Summary strip */}
          <div style={{ display: 'flex', gap: 24, marginBottom: 20 }}>
            {[
              { label: 'Total nómina', value: fmt(data.grandTotal), color: T.text },
              { label: 'Personal',     value: String(data.workerCount), color: T.muted },
              { label: 'HT procesadas', value: String(data.htDocCount), color: T.muted },
            ].map(s => (
              <div key={s.label}>
                <div style={{ fontSize: 7, letterSpacing: '0.16em', textTransform: 'uppercase', color: T.dim, marginBottom: 4 }}>{s.label}</div>
                <div style={{ fontSize: 16, fontFamily: 'Fraunces, serif', fontStyle: 'italic', color: s.color }}>{s.value}</div>
              </div>
            ))}
          </div>

          {/* Table */}
          <div style={{ border: `1px solid ${T.border}` }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11, fontFamily: "'IBM Plex Mono', monospace" }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${T.border}`, background: T.surface }}>
                  {['Nombre', 'Cargo', 'Días', 'Tarifa / día', 'Total', 'Proyectos'].map(h => (
                    <th key={h} style={{ padding: '8px 12px', textAlign: h === 'Nombre' || h === 'Cargo' ? 'left' : 'right', fontSize: 7, letterSpacing: '0.16em', textTransform: 'uppercase', color: T.dim, fontWeight: 400 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.rows.map((row, i) => (
                  <tr key={row.name} style={{ borderBottom: `1px solid ${T.border}`, background: i % 2 === 0 ? 'transparent' : `${T.surface}80` }}>
                    <td style={{ padding: '10px 12px', color: T.text }}>{row.name}</td>
                    <td style={{ padding: '10px 12px', color: T.muted, fontSize: 9 }}>{row.role}</td>
                    <td style={{ padding: '10px 12px', color: T.text, textAlign: 'right' }}>{row.totalDays}</td>
                    <td style={{ padding: '10px 12px', color: T.muted, textAlign: 'right' }}>{fmt(row.dailyRate)}</td>
                    <td style={{ padding: '10px 12px', color: T.text, textAlign: 'right', fontWeight: 600 }}>{fmt(row.total)}</td>
                    <td style={{ padding: '10px 12px', color: T.dim, textAlign: 'right', fontSize: 9 }}>{row.projectCount}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ borderTop: `2px solid ${T.border}`, background: T.surface }}>
                  <td colSpan={4} style={{ padding: '10px 12px', fontSize: 8, letterSpacing: '0.14em', textTransform: 'uppercase', color: T.dim }}>Total del mes</td>
                  <td style={{ padding: '10px 12px', textAlign: 'right', color: T.text, fontFamily: 'Fraunces, serif', fontStyle: 'italic', fontSize: 16 }}>{fmt(data.grandTotal)}</td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────
export function TeamPage() {
  const [tab, setTab]           = useState<'equipo' | 'nomina'>('equipo');
  const [staff, setStaff]       = useState<StaffMember[]>([]);
  const [loading, setLoading]   = useState(true);
  const [showNew, setShowNew]   = useState(false);
  const [editMember, setEditMember] = useState<StaffMember | null>(null);

  useEffect(() => {
    api.staff.list({ all: true })
      .then(d => setStaff(d as StaffMember[]))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const toggleActive = async (member: StaffMember) => {
    const updated = await api.staff.patch(member._id, { isActive: !member.isActive }) as StaffMember;
    setStaff(prev => prev.map(s => s._id === updated._id ? updated : s));
  };

  const activeStaff   = staff.filter(s => s.isActive);
  const inactiveStaff = staff.filter(s => !s.isActive);

  const tabStyle = (id: typeof tab): React.CSSProperties => ({
    fontSize: 8, letterSpacing: '0.16em', textTransform: 'uppercase',
    padding: '7px 18px', border: 'none', cursor: 'pointer',
    fontFamily: "'IBM Plex Mono', monospace",
    background: tab === id ? T.accent : 'transparent',
    color: tab === id ? '#fff' : T.muted,
    transition: 'all 0.12s',
  });

  return (
    <>
      <style>{STYLES}</style>
      <div style={{ padding: '52px 48px 80px', color: T.text, fontFamily: "'IBM Plex Mono', monospace", maxWidth: 1000 }}>

        {/* Header */}
        <div className="k-in" style={{ marginBottom: 32 }}>
          <p style={{ fontSize: 8, letterSpacing: '0.26em', textTransform: 'uppercase', color: T.dim, margin: '0 0 10px' }}>Gestión de personal</p>
          <h1 style={{ fontFamily: 'Fraunces, serif', fontStyle: 'italic', fontSize: 'clamp(36px, 4vw, 52px)', fontWeight: 400, color: T.text, lineHeight: 1.0, margin: '0 0 24px' }}>
            Equipo
          </h1>

          {/* Tabs + New button */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
            <div style={{ display: 'flex', background: T.surface, border: `1px solid ${T.border}`, padding: 3, gap: 2 }}>
              <button style={tabStyle('equipo')} onClick={() => setTab('equipo')}>Equipo</button>
              <button style={tabStyle('nomina')} onClick={() => setTab('nomina')}>Nómina</button>
            </div>
            {tab === 'equipo' && (
              <button
                onClick={() => setShowNew(true)}
                style={{ display: 'flex', alignItems: 'center', gap: 6, background: T.accent, border: 'none', color: '#fff', padding: '8px 16px', fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', fontFamily: "'IBM Plex Mono', monospace", cursor: 'pointer' }}
              >
                <Plus size={12} /> Nuevo miembro
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        {tab === 'equipo' ? (
          loading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
              {[...Array(4)].map((_, i) => <div key={i} style={{ height: 100, background: T.card, border: `1px solid ${T.border}`, opacity: 0.4 }} />)}
            </div>
          ) : (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
                {activeStaff.map((m, i) => (
                  <div key={m._id} style={{ animationDelay: `${i * 30}ms` }}>
                    <StaffCard member={m} onToggle={() => toggleActive(m)} onEdit={() => setEditMember(m)} />
                  </div>
                ))}
              </div>

              {inactiveStaff.length > 0 && (
                <div style={{ marginTop: 32 }}>
                  <p style={{ fontSize: 8, letterSpacing: '0.2em', textTransform: 'uppercase', color: T.dim, marginBottom: 12 }}>Inactivos</p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12, opacity: 0.55 }}>
                    {inactiveStaff.map(m => (
                      <StaffCard key={m._id} member={m} onToggle={() => toggleActive(m)} onEdit={() => setEditMember(m)} />
                    ))}
                  </div>
                </div>
              )}

              {staff.length === 0 && (
                <p style={{ fontSize: 11, color: T.dim }}>Sin personal registrado. Agrega el primer miembro del equipo.</p>
              )}
            </>
          )
        ) : (
          <PayrollTab />
        )}
      </div>

      {showNew && (
        <StaffModal
          onClose={() => setShowNew(false)}
          onSaved={s => { setStaff(prev => [...prev, s]); setShowNew(false); }}
        />
      )}

      {editMember && (
        <StaffModal
          initial={editMember}
          onClose={() => setEditMember(null)}
          onSaved={updated => {
            setStaff(prev => prev.map(s => s._id === updated._id ? updated : s));
            setEditMember(null);
          }}
        />
      )}
    </>
  );
}
