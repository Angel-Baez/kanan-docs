import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Plus, X, Loader2, ArrowRight, Search } from 'lucide-react';
import { api } from '../api/client.ts';
import { useToast } from '../context/ToastContext.tsx';
import { CardSkeleton } from '../components/ui/Skeleton.tsx';
import { Pagination } from '../components/ui/Pagination.tsx';
import type { KananClient } from '@kanan/shared';

const T = {
  card:    '#1E1B17',
  cardHov: '#252118',
  border:  '#2A2520',
  text:    '#E8DFCF',
  muted:   '#7A7068',
  dim:     '#4A4540',
  accent:  '#B95D34',
} as const;

const TYPE_CFG: Record<string, { text: string; bg: string; border: string }> = {
  residencial:  { text: '#9CAA72', bg: '#9CAA7210', border: '#9CAA7230' },
  comercial:    { text: '#C9AA71', bg: '#C9AA7110', border: '#C9AA7130' },
  institucional:{ text: '#7A9AAA', bg: '#7A9AAA10', border: '#7A9AAA30' },
};

const STATUS_COLOR: Record<string, string> = {
  cotizando:  '#C9AA71',
  activo:     '#7A8C47',
  completado: '#9CAA72',
  garantia:   '#C4673A',
};

const LIMIT = 24;

interface ClientWithStats extends KananClient {
  projectCount?: number;
  latestProjectStatus?: string;
}

interface PaginatedClients {
  clients: ClientWithStats[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

const STYLES = `
@keyframes kFadeUp { from { opacity:0;transform:translateY(6px); } to { opacity:1;transform:translateY(0); } }
.k-in { animation: kFadeUp 0.28s ease both; }
@keyframes spin { to { transform: rotate(360deg); } }
`;

export function ClientListPage() {
  const [clients, setClients]   = useState<ClientWithStats[]>([]);
  const [loading, setLoading]   = useState(true);
  const [page, setPage]         = useState(1);
  const [total, setTotal]       = useState(0);
  const [pages, setPages]       = useState(1);
  const [search, setSearch]     = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [showNew, setShowNew]   = useState(false);
  const [newName, setNewName]   = useState('');
  const [newType, setNewType]   = useState<'residencial' | 'comercial' | 'institucional'>('residencial');
  const [saving, setSaving]     = useState(false);
  const { addToast } = useToast();

  const load = useCallback((p: number, q: string) => {
    setLoading(true);
    const params: Record<string, string> = {
      withStats: 'true',
      page: String(p),
      limit: String(LIMIT),
    };
    if (q) params['q'] = q;
    api.clients.list(params)
      .then(data => {
        const res = data as PaginatedClients;
        setClients(res.clients);
        setTotal(res.total);
        setPages(res.pages);
      })
      .catch(() => addToast('Error cargando clientes', 'error'))
      .finally(() => setLoading(false));
  }, [addToast]);

  useEffect(() => {
    load(page, search);
  }, [page, search, load]);

  // Debounce search input
  useEffect(() => {
    const t = setTimeout(() => {
      setPage(1);
      setSearch(searchInput);
    }, 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setSaving(true);
    try {
      const created = await api.clients.create({ name: newName.trim(), type: newType }) as ClientWithStats;
      setNewName('');
      setShowNew(false);
      addToast('Cliente creado', 'success');
      // Refresh first page to include new client
      setPage(1);
      setSearch('');
      setSearchInput('');
      load(1, '');
      void created; // suppress unused var
    } catch {
      addToast('Error al crear cliente', 'error');
    } finally {
      setSaving(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    background: '#221E19', border: `1px solid ${T.border}`, color: T.text,
    padding: '9px 12px', fontSize: 12, fontFamily: "'IBM Plex Mono', monospace",
    outline: 'none', width: '100%', boxSizing: 'border-box',
  };

  return (
    <>
      <style>{STYLES}</style>
      <div style={{ padding: '52px 48px 80px', color: T.text, fontFamily: "'IBM Plex Mono', monospace", maxWidth: 1100 }}>

        {/* Header */}
        <div className="k-in" style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 36, animationDelay: '0ms' }}>
          <div>
            <p style={{ fontSize: 8, letterSpacing: '0.26em', textTransform: 'uppercase', color: T.dim, margin: '0 0 10px' }}>
              Directorio
            </p>
            <h1 style={{ fontFamily: 'Fraunces, serif', fontStyle: 'italic', fontSize: 'clamp(36px, 4vw, 52px)', fontWeight: 400, color: T.text, lineHeight: 1.0, margin: 0 }}>
              Clientes
            </h1>
          </div>
          <button
            onClick={() => setShowNew(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', padding: '9px 18px', background: T.accent, border: 'none', color: '#fff', cursor: 'pointer', fontFamily: "'IBM Plex Mono', monospace" }}
          >
            <Plus size={12} /> Nuevo cliente
          </button>
        </div>

        {/* Search */}
        <div className="k-in" style={{ animationDelay: '40ms', marginBottom: 24 }}>
          <div style={{ position: 'relative', maxWidth: 340 }}>
            <Search size={12} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: T.dim, pointerEvents: 'none' }} />
            <input
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              placeholder="Buscar cliente…"
              style={{ ...inputStyle, paddingLeft: 34, fontSize: 11 }}
            />
          </div>
        </div>

        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 12 }}>
            {[...Array(6)].map((_, i) => <CardSkeleton key={i} />)}
          </div>
        ) : clients.length === 0 ? (
          <p style={{ fontSize: 11, color: T.dim }}>
            {search ? `Sin resultados para "${search}".` : 'Sin clientes registrados.'}
          </p>
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 10 }}>
              {clients.map((client, i) => {
                const typeCfg = TYPE_CFG[client.type] ?? TYPE_CFG['residencial']!;
                const statusColor = client.latestProjectStatus ? STATUS_COLOR[client.latestProjectStatus] : null;
                return (
                  <Link
                    key={String(client._id)}
                    to={`/clients/${client._id}`}
                    className="k-in"
                    style={{
                      display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                      background: T.card, border: `1px solid ${T.border}`,
                      padding: '16px 18px', textDecoration: 'none',
                      transition: 'background 0.12s, border-color 0.12s',
                      animationDelay: `${40 + i * 25}ms`,
                      minHeight: 90,
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = T.cardHov; e.currentTarget.style.borderColor = '#3A3530'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = T.card; e.currentTarget.style.borderColor = T.border; }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
                      <div style={{ fontSize: 13, color: T.text, lineHeight: 1.3 }}>{client.name}</div>
                      <span style={{ fontSize: 7, letterSpacing: '0.16em', textTransform: 'uppercase', color: typeCfg.text, background: typeCfg.bg, border: `1px solid ${typeCfg.border}`, padding: '3px 8px', flexShrink: 0 }}>
                        {client.type}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 14 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontSize: 9, color: T.dim }}>
                          {client.projectCount ?? 0} {client.projectCount === 1 ? 'proyecto' : 'proyectos'}
                        </span>
                        {statusColor && (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 9, color: statusColor }}>
                            <span style={{ width: 5, height: 5, borderRadius: '50%', background: statusColor }} />
                            {client.latestProjectStatus}
                          </span>
                        )}
                      </div>
                      <ArrowRight size={11} style={{ color: T.dim }} />
                    </div>
                  </Link>
                );
              })}
            </div>

            <Pagination page={page} pages={pages} total={total} limit={LIMIT} onChange={p => { setPage(p); window.scrollTo({ top: 0, behavior: 'smooth' }); }} />
          </>
        )}
      </div>

      {/* New client modal */}
      {showNew && (
        <div onClick={() => setShowNew(false)} style={{ position: 'fixed', inset: 0, zIndex: 400, background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#1A1714', border: `1px solid ${T.border}`, width: '100%', maxWidth: 400, fontFamily: "'IBM Plex Mono', monospace" }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 24px', borderBottom: `1px solid ${T.border}` }}>
              <span style={{ fontSize: 9, letterSpacing: '0.22em', textTransform: 'uppercase', color: T.muted }}>Nuevo cliente</span>
              <button onClick={() => setShowNew(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.muted, display: 'flex', padding: 0 }}><X size={15} /></button>
            </div>
            <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span style={{ fontSize: 8, letterSpacing: '0.18em', textTransform: 'uppercase', color: T.muted }}>Nombre *</span>
                <input value={newName} onChange={e => setNewName(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') handleCreate(); }} style={inputStyle} autoFocus />
              </label>
              <div>
                <span style={{ fontSize: 8, letterSpacing: '0.18em', textTransform: 'uppercase', color: T.muted, display: 'block', marginBottom: 8 }}>Tipo</span>
                <div style={{ display: 'flex', gap: 6 }}>
                  {(['residencial', 'comercial', 'institucional'] as const).map(t => (
                    <button key={t} onClick={() => setNewType(t)} style={{ fontSize: 8, letterSpacing: '0.14em', textTransform: 'uppercase', padding: '6px 12px', cursor: 'pointer', fontFamily: "'IBM Plex Mono', monospace", background: newType === t ? TYPE_CFG[t]!.bg : 'transparent', color: newType === t ? TYPE_CFG[t]!.text : T.dim, border: `1px solid ${newType === t ? TYPE_CFG[t]!.border : T.border}`, transition: 'all 0.12s' }}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div style={{ padding: '0 24px 24px', display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowNew(false)} style={{ fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', padding: '9px 20px', background: 'none', border: `1px solid ${T.border}`, color: T.muted, cursor: 'pointer', fontFamily: "'IBM Plex Mono', monospace" }}>Cancelar</button>
              <button onClick={handleCreate} disabled={saving || !newName.trim()} style={{ fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', padding: '9px 20px', background: saving ? T.border : T.accent, border: 'none', color: '#fff', cursor: saving ? 'default' : 'pointer', fontFamily: "'IBM Plex Mono', monospace", display: 'flex', alignItems: 'center', gap: 7 }}>
                {saving && <Loader2 size={11} style={{ animation: 'spin 1s linear infinite' }} />}
                Crear
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
