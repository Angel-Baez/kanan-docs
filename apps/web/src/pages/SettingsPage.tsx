import { useEffect, useState } from 'react';
import { UserCircle2, Plus, X, Key, Check } from 'lucide-react';
import { api } from '../api/client.ts';
import { useAuth } from '../context/AuthContext.tsx';

// ── Design tokens ─────────────────────────────────────────────────────────────
const T = {
  surface: '#161310', card: '#1E1B17', border: '#2A2520',
  text: '#E8DFCF', muted: '#A8A098', dim: '#7A7068', faint: '#4A4540',
  accent: '#B95D34', green: '#7A8C47', red: '#C0392B',
} as const;

const mono: React.CSSProperties = { fontFamily: "'IBM Plex Mono', monospace" };

const inputStyle: React.CSSProperties = {
  ...mono, width: '100%', boxSizing: 'border-box',
  background: T.surface, border: `1px solid ${T.border}`,
  color: T.text, padding: '8px 10px', fontSize: 11, outline: 'none',
};

const btnPrimary: React.CSSProperties = {
  ...mono, background: T.accent, border: 'none', color: '#fff',
  padding: '9px 20px', fontSize: 9, letterSpacing: '0.16em',
  textTransform: 'uppercase', cursor: 'pointer',
};

const btnGhost: React.CSSProperties = {
  ...mono, background: 'transparent', border: `1px solid ${T.border}`,
  color: T.dim, padding: '7px 14px', fontSize: 9, letterSpacing: '0.14em',
  textTransform: 'uppercase', cursor: 'pointer',
};

function Label({ children }: { children: React.ReactNode }) {
  return <label style={{ ...mono, fontSize: 8, letterSpacing: '0.14em', textTransform: 'uppercase', color: T.dim, display: 'block', marginBottom: 5 }}>{children}</label>;
}

function Field({ label, value, onChange, type = 'text', placeholder }: {
  label: string; value: string; onChange: (v: string) => void;
  type?: string; placeholder?: string;
}) {
  return (
    <div>
      <Label>{label}</Label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder} style={inputStyle} />
    </div>
  );
}

function Toast({ msg, ok }: { msg: string; ok: boolean }) {
  return (
    <div style={{
      position: 'fixed', bottom: 24, right: 24, zIndex: 999,
      background: ok ? T.green : T.red, color: '#fff',
      padding: '10px 18px', fontSize: 10, ...mono,
      boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
    }}>
      {ok ? '✓ ' : '✗ '}{msg}
    </div>
  );
}

function useToast() {
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const show = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  };
  return { toast, show };
}

// ── Section: Mi cuenta ────────────────────────────────────────────────────────
function AccountTab({ show }: { show: (msg: string, ok?: boolean) => void }) {
  const { user } = useAuth();
  const [name,    setName]    = useState(user?.name ?? '');
  const [cur,     setCur]     = useState('');
  const [next,    setNext]    = useState('');
  const [confirm, setConfirm] = useState('');
  const [saving,  setSaving]  = useState(false);

  const saveName = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try { await api.settings.updateMe(name.trim()); show('Nombre actualizado'); }
    catch (e: unknown) { show(e instanceof Error ? e.message : 'Error', false); }
    finally { setSaving(false); }
  };

  const savePassword = async () => {
    if (next !== confirm) { show('Las contraseñas no coinciden', false); return; }
    if (next.length < 8)  { show('Mínimo 8 caracteres', false); return; }
    setSaving(true);
    try { await api.settings.changePassword(cur, next); show('Contraseña actualizada'); setCur(''); setNext(''); setConfirm(''); }
    catch (e: unknown) { show(e instanceof Error ? e.message : 'Error', false); }
    finally { setSaving(false); }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32, maxWidth: 480 }}>
      {/* Name */}
      <div style={{ background: T.card, border: `1px solid ${T.border}`, padding: '24px 24px 20px' }}>
        <p style={{ ...mono, fontSize: 8, letterSpacing: '0.2em', textTransform: 'uppercase', color: T.faint, margin: '0 0 20px' }}>Perfil</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Field label="Nombre completo" value={name} onChange={setName} placeholder="Tu nombre" />
          <div>
            <Label>Email</Label>
            <div style={{ ...mono, fontSize: 11, color: T.muted, padding: '8px 0' }}>{user?.email}</div>
          </div>
          <div>
            <Label>Rol</Label>
            <div style={{ ...mono, fontSize: 11, color: T.muted, padding: '8px 0', textTransform: 'capitalize' }}>{user?.role}</div>
          </div>
        </div>
        <button onClick={saveName} disabled={saving || !name.trim()} style={{ ...btnPrimary, marginTop: 20, opacity: !name.trim() ? 0.5 : 1 }}>
          {saving ? 'Guardando...' : 'Guardar nombre'}
        </button>
      </div>

      {/* Password */}
      <div style={{ background: T.card, border: `1px solid ${T.border}`, padding: '24px 24px 20px' }}>
        <p style={{ ...mono, fontSize: 8, letterSpacing: '0.2em', textTransform: 'uppercase', color: T.faint, margin: '0 0 20px' }}>
          <Key size={10} style={{ verticalAlign: 'middle', marginRight: 6 }} />
          Cambiar contraseña
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Field label="Contraseña actual" value={cur}     onChange={setCur}     type="password" />
          <Field label="Nueva contraseña"  value={next}    onChange={setNext}    type="password" placeholder="Mínimo 8 caracteres" />
          <Field label="Confirmar nueva"   value={confirm} onChange={setConfirm} type="password" />
        </div>
        <button onClick={savePassword} disabled={saving || !cur || !next || !confirm} style={{ ...btnPrimary, marginTop: 20, opacity: (!cur||!next||!confirm) ? 0.5 : 1 }}>
          {saving ? 'Guardando...' : 'Cambiar contraseña'}
        </button>
      </div>
    </div>
  );
}

// ── Section: Empresa ──────────────────────────────────────────────────────────
interface Company { name: string; tagline: string; rnc: string; phone: string; email: string; address: string; website: string; }

function CompanyTab({ show }: { show: (msg: string, ok?: boolean) => void }) {
  const [form,   setForm]   = useState<Company>({ name:'', tagline:'', rnc:'', phone:'', email:'', address:'', website:'' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.settings.getCompany().then(d => setForm(d as Company)).catch(() => {});
  }, []);

  const set = (k: keyof Company) => (v: string) => setForm(f => ({ ...f, [k]: v }));

  const save = async () => {
    setSaving(true);
    try { await api.settings.updateCompany(form); show('Datos de empresa actualizados'); }
    catch (e: unknown) { show(e instanceof Error ? e.message : 'Error', false); }
    finally { setSaving(false); }
  };

  return (
    <div style={{ background: T.card, border: `1px solid ${T.border}`, padding: '24px 24px 20px', maxWidth: 560 }}>
      <p style={{ ...mono, fontSize: 8, letterSpacing: '0.2em', textTransform: 'uppercase', color: T.faint, margin: '0 0 20px' }}>
        Datos de la empresa
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px 20px' }}>
        <Field label="Nombre *"    value={form.name}    onChange={set('name')}    placeholder="KANAN" />
        <Field label="Subtítulo *" value={form.tagline} onChange={set('tagline')} placeholder="REMODELACIONES" />
        <Field label="RNC"         value={form.rnc}     onChange={set('rnc')}     placeholder="1-01-12345-6" />
        <Field label="Teléfono"    value={form.phone}   onChange={set('phone')}   placeholder="809-555-0001" />
        <Field label="Email"       value={form.email}   onChange={set('email')}   placeholder="info@kanan.do" />
        <Field label="Sitio web"   value={form.website} onChange={set('website')} placeholder="www.kanan.do" />
      </div>
      <div style={{ marginTop: 14 }}>
        <Field label="Dirección" value={form.address} onChange={set('address')} placeholder="Av. Abraham Lincoln #XXX, Santo Domingo" />
      </div>
      <button onClick={save} disabled={saving} style={{ ...btnPrimary, marginTop: 20 }}>
        {saving ? 'Guardando...' : 'Guardar empresa'}
      </button>
    </div>
  );
}

// ── Section: Usuarios ─────────────────────────────────────────────────────────
interface AppUser { _id: string; name: string; email: string; role: string; isActive: boolean; }

const ROLE_OPTS = ['admin', 'jefe_obra', 'vendedor'];
const ROLE_LABEL: Record<string, string> = { admin: 'Admin', jefe_obra: 'Jefe de Obra', vendedor: 'Vendedor' };

function NewUserModal({ onClose, onCreated }: { onClose: () => void; onCreated: (u: AppUser) => void }) {
  const [name,     setName]     = useState('');
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [role,     setRole]     = useState('vendedor');
  const [saving,   setSaving]   = useState(false);
  const [err,      setErr]      = useState('');

  const save = async () => {
    setErr('');
    setSaving(true);
    try {
      const u = await api.settings.createUser({ name, email, password, role }) as AppUser;
      onCreated(u);
    } catch (e: unknown) { setErr(e instanceof Error ? e.message : 'Error'); }
    finally { setSaving(false); }
  };

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:50 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: T.card, border: `1px solid ${T.border}`, padding:'28px 24px', width:380, ...mono }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
          <p style={{ fontSize:8, letterSpacing:'0.2em', textTransform:'uppercase', color:T.faint, margin:0 }}>Nuevo usuario</p>
          <button onClick={onClose} style={{ background:'none', border:'none', color:T.dim, cursor:'pointer' }}><X size={14} /></button>
        </div>
        {err && <p style={{ fontSize:10, color:T.red, marginBottom:12 }}>{err}</p>}
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          <Field label="Nombre completo *" value={name}     onChange={setName}     placeholder="Ana Reyes" />
          <Field label="Email *"           value={email}    onChange={setEmail}    placeholder="ana@kanan.do" />
          <Field label="Contraseña *"      value={password} onChange={setPassword} type="password" placeholder="Mínimo 8 caracteres" />
          <div>
            <Label>Rol</Label>
            <select value={role} onChange={e => setRole(e.target.value)}
              style={{ ...inputStyle, cursor:'pointer' }}>
              {ROLE_OPTS.map(r => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
            </select>
          </div>
        </div>
        <button onClick={save} disabled={saving || !name || !email || !password}
          style={{ ...btnPrimary, marginTop:20, width:'100%', opacity:(!name||!email||!password)?0.5:1 }}>
          {saving ? 'Creando...' : 'Crear usuario'}
        </button>
      </div>
    </div>
  );
}

function ResetPasswordModal({ user, onClose, show }: { user: AppUser; onClose: () => void; show: (m: string, ok?: boolean) => void }) {
  const [password, setPassword] = useState('');
  const [saving,   setSaving]   = useState(false);

  const save = async () => {
    setSaving(true);
    try { await api.settings.resetPassword(user._id, password); show('Contraseña actualizada'); onClose(); }
    catch (e: unknown) { show(e instanceof Error ? e.message : 'Error', false); }
    finally { setSaving(false); }
  };

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:50 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: T.card, border: `1px solid ${T.border}`, padding:'28px 24px', width:340, ...mono }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
          <p style={{ fontSize:8, letterSpacing:'0.2em', textTransform:'uppercase', color:T.faint, margin:0 }}>Resetear contraseña</p>
          <button onClick={onClose} style={{ background:'none', border:'none', color:T.dim, cursor:'pointer' }}><X size={14} /></button>
        </div>
        <p style={{ fontSize:11, color:T.muted, marginBottom:16 }}>{user.name}</p>
        <Field label="Nueva contraseña *" value={password} onChange={setPassword} type="password" placeholder="Mínimo 8 caracteres" />
        <button onClick={save} disabled={saving || password.length < 8}
          style={{ ...btnPrimary, marginTop:16, width:'100%', opacity:password.length<8?0.5:1 }}>
          {saving ? 'Guardando...' : 'Guardar'}
        </button>
      </div>
    </div>
  );
}

function UsersTab({ show }: { show: (msg: string, ok?: boolean) => void }) {
  const { user: me } = useAuth();
  const [users,   setUsers]   = useState<AppUser[]>([]);
  const [showNew, setShowNew] = useState(false);
  const [resetTarget, setResetTarget] = useState<AppUser | null>(null);

  useEffect(() => {
    api.settings.listUsers().then(d => setUsers(d as AppUser[])).catch(() => {});
  }, []);

  const toggleActive = async (u: AppUser) => {
    try {
      const updated = await api.settings.patchUser(u._id, { isActive: !u.isActive }) as AppUser;
      setUsers(prev => prev.map(x => x._id === updated._id ? updated : x));
    } catch (e: unknown) { show(e instanceof Error ? e.message : 'Error', false); }
  };

  const changeRole = async (u: AppUser, role: string) => {
    try {
      const updated = await api.settings.patchUser(u._id, { role }) as AppUser;
      setUsers(prev => prev.map(x => x._id === updated._id ? updated : x));
    } catch (e: unknown) { show(e instanceof Error ? e.message : 'Error', false); }
  };

  const initials = (name: string) => name.split(' ').slice(0,2).map(w => w[0]).join('').toUpperCase();

  return (
    <>
      <div style={{ display:'flex', justifyContent:'flex-end', marginBottom:16 }}>
        <button onClick={() => setShowNew(true)} style={{ ...btnPrimary, display:'flex', alignItems:'center', gap:6 }}>
          <Plus size={11} /> Nuevo usuario
        </button>
      </div>

      <div style={{ display:'flex', flexDirection:'column', gap:8, maxWidth:680 }}>
        {users.map(u => (
          <div key={u._id} style={{
            background: T.card, border: `1px solid ${T.border}`,
            padding:'14px 18px', display:'flex', alignItems:'center', gap:14,
            opacity: u.isActive ? 1 : 0.55,
          }}>
            {/* Avatar */}
            <div style={{ width:36, height:36, borderRadius:'50%', background:`${T.accent}22`, border:`1px solid ${T.accent}44`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, color:T.accent, ...mono, fontWeight:700, flexShrink:0 }}>
              {initials(u.name) || <UserCircle2 size={18} />}
            </div>

            {/* Info */}
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <span style={{ fontSize:12, color:T.text, ...mono }}>{u.name}</span>
                {u._id === me?.id && <span style={{ fontSize:7, color:T.faint, letterSpacing:'0.14em', textTransform:'uppercase' }}>tú</span>}
              </div>
              <div style={{ fontSize:9, color:T.dim, marginTop:2 }}>{u.email}</div>
            </div>

            {/* Role selector */}
            <select
              value={u.role}
              onChange={e => changeRole(u, e.target.value)}
              disabled={u._id === me?.id}
              style={{ ...mono, background:T.surface, border:`1px solid ${T.border}`, color:T.muted, padding:'4px 8px', fontSize:9, cursor:'pointer', letterSpacing:'0.08em' }}
            >
              {ROLE_OPTS.map(r => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
            </select>

            {/* Reset password */}
            <button onClick={() => setResetTarget(u)} title="Resetear contraseña"
              style={{ ...btnGhost, padding:'5px 10px', display:'flex', alignItems:'center', gap:4 }}>
              <Key size={10} />
            </button>

            {/* Toggle active */}
            {u._id !== me?.id && (
              <button onClick={() => toggleActive(u)}
                style={{ ...mono, background:u.isActive?`${T.green}18`:`${T.faint}18`, border:`1px solid ${u.isActive?T.green:T.faint}44`, color:u.isActive?T.green:T.faint, padding:'4px 10px', fontSize:7, letterSpacing:'0.12em', textTransform:'uppercase', cursor:'pointer' }}>
                {u.isActive ? <><Check size={9}/> Activo</> : 'Inactivo'}
              </button>
            )}
          </div>
        ))}
        {users.length === 0 && <p style={{ fontSize:11, color:T.faint }}>Sin usuarios registrados.</p>}
      </div>

      {showNew && (
        <NewUserModal
          onClose={() => setShowNew(false)}
          onCreated={u => { setUsers(prev => [...prev, u]); setShowNew(false); show('Usuario creado'); }}
        />
      )}
      {resetTarget && (
        <ResetPasswordModal user={resetTarget} onClose={() => setResetTarget(null)} show={show} />
      )}
    </>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
type Tab = 'cuenta' | 'empresa' | 'usuarios';

export function SettingsPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>('cuenta');
  const { toast, show } = useToast();

  const tabStyle = (id: Tab): React.CSSProperties => ({
    ...mono, fontSize:8, letterSpacing:'0.16em', textTransform:'uppercase',
    padding:'7px 18px', border:'none', cursor:'pointer',
    background: tab === id ? T.accent : 'transparent',
    color: tab === id ? '#fff' : T.dim,
    transition:'all 0.12s',
  });

  return (
    <div style={{ padding:'52px 48px 80px', color:T.text, ...mono, maxWidth:900 }}>
      {/* Header */}
      <p style={{ fontSize:8, letterSpacing:'0.26em', textTransform:'uppercase', color:T.faint, margin:'0 0 10px' }}>
        Sistema
      </p>
      <h1 style={{ fontFamily:'Fraunces, serif', fontStyle:'italic', fontSize:'clamp(36px,4vw,52px)', fontWeight:400, color:T.text, lineHeight:1.0, margin:'0 0 28px' }}>
        Configuración
      </h1>

      {/* Tabs */}
      <div style={{ display:'flex', background:T.surface, border:`1px solid ${T.border}`, padding:3, gap:2, marginBottom:28, width:'fit-content' }}>
        <button style={tabStyle('cuenta')}   onClick={() => setTab('cuenta')}>Mi cuenta</button>
        <button style={tabStyle('empresa')}  onClick={() => setTab('empresa')}>Empresa</button>
        {user?.role === 'admin' && (
          <button style={tabStyle('usuarios')} onClick={() => setTab('usuarios')}>Usuarios</button>
        )}
      </div>

      {/* Content */}
      {tab === 'cuenta'   && <AccountTab show={show} />}
      {tab === 'empresa'  && <CompanyTab show={show} />}
      {tab === 'usuarios' && user?.role === 'admin' && <UsersTab show={show} />}

      {toast && <Toast msg={toast.msg} ok={toast.ok} />}
    </div>
  );
}
