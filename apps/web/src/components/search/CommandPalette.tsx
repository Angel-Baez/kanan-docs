import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Users, KanbanSquare, FileText, X } from 'lucide-react';
import { api } from '../../api/client.ts';

interface SearchClient   { _id: string; name: string; type: string; href: string; }
interface SearchProject  { _id: string; name: string; status: string; address1?: string; href: string; }
interface SearchDocument { _id: string; title: string; templateId: string; href: string; }

interface SearchResults {
  clients:   SearchClient[];
  projects:  SearchProject[];
  documents: SearchDocument[];
}

type FlatResult =
  | { kind: 'client';   item: SearchClient }
  | { kind: 'project';  item: SearchProject }
  | { kind: 'document'; item: SearchDocument };

const STATUS_LABEL: Record<string, string> = {
  cotizando: 'Cotizando', activo: 'Activo', completado: 'Completado', garantia: 'Garantía',
};

function useDebounce<T>(value: T, ms: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return debounced;
}

interface Props { onClose: () => void; }

export function CommandPalette({ onClose }: Props) {
  const navigate  = useNavigate();
  const inputRef  = useRef<HTMLInputElement>(null);
  const listRef   = useRef<HTMLDivElement>(null);

  const [query,   setQuery]   = useState('');
  const [results, setResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [active,  setActive]  = useState(0);

  const debouncedQuery = useDebounce(query, 280);

  // Focus input on mount
  useEffect(() => { inputRef.current?.focus(); }, []);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  // Fetch results
  useEffect(() => {
    if (!debouncedQuery || debouncedQuery.length < 2) { setResults(null); setActive(0); return; }
    setLoading(true);
    api.search.query(debouncedQuery)
      .then(d => { setResults(d as SearchResults); setActive(0); })
      .catch(() => setResults(null))
      .finally(() => setLoading(false));
  }, [debouncedQuery]);

  // Flat list for keyboard nav
  const flat: FlatResult[] = results ? [
    ...results.clients.map(item => ({ kind: 'client'   as const, item })),
    ...results.projects.map(item => ({ kind: 'project'  as const, item })),
    ...results.documents.map(item => ({ kind: 'document' as const, item })),
  ] : [];

  const navigate_to = useCallback((href: string) => {
    navigate(href);
    onClose();
  }, [navigate, onClose]);

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') { e.preventDefault(); setActive(a => Math.min(a + 1, flat.length - 1)); }
      if (e.key === 'ArrowUp')   { e.preventDefault(); setActive(a => Math.max(a - 1, 0)); }
      if (e.key === 'Enter' && flat[active]) { navigate_to(flat[active].item.href); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [flat, active, navigate_to]);

  // Scroll active into view
  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-idx="${active}"]`) as HTMLElement | null;
    el?.scrollIntoView({ block: 'nearest' });
  }, [active]);

  const total = flat.length;

  return (
    <>
      {/* Overlay */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(2px)',
          zIndex: 300,
        }}
      />

      {/* Palette */}
      <div style={{
        position: 'fixed',
        top: '18vh',
        left: '50%',
        transform: 'translateX(-50%)',
        width: 560,
        maxWidth: 'calc(100vw - 40px)',
        background: '#1E1B17',
        border: '1px solid #2A2520',
        boxShadow: '0 24px 64px rgba(0,0,0,0.7)',
        zIndex: 301,
        fontFamily: "'IBM Plex Mono', monospace",
        overflow: 'hidden',
      }}>
        {/* Input row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderBottom: '1px solid #2A2520' }}>
          <Search size={15} color="#4A4540" />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Buscar proyectos, clientes, documentos..."
            style={{
              flex: 1, background: 'none', border: 'none', outline: 'none',
              color: '#E8DFCF', fontSize: 13,
              fontFamily: "'IBM Plex Mono', monospace",
            }}
          />
          {loading && <span style={{ fontSize: 8, color: '#4A4540', letterSpacing: '0.14em' }}>...</span>}
          <button
            onClick={onClose}
            style={{ background: 'none', border: '1px solid #2A2520', color: '#4A4540', cursor: 'pointer', padding: '2px 6px', fontSize: 8, letterSpacing: '0.1em' }}
          >
            ESC
          </button>
        </div>

        {/* Results */}
        <div ref={listRef} style={{ maxHeight: 400, overflowY: 'auto' }}>
          {!query || query.length < 2 ? (
            <div style={{ padding: '24px 20px', fontSize: 10, color: '#4A4540', textAlign: 'center' }}>
              Escribe al menos 2 caracteres para buscar
            </div>
          ) : total === 0 && !loading ? (
            <div style={{ padding: '24px 20px', fontSize: 10, color: '#4A4540', textAlign: 'center' }}>
              Sin resultados para «{query}»
            </div>
          ) : (
            <>
              {results && results.clients.length > 0 && (
                <Section label="Clientes" icon={<Users size={10} />}>
                  {results.clients.map((c, i) => {
                    const idx = flat.findIndex(f => f.kind === 'client' && f.item._id === c._id);
                    return (
                      <ResultRow key={c._id} idx={idx} active={active === idx} onClick={() => navigate_to(c.href)} onHover={() => setActive(idx)}>
                        <span style={{ color: '#E8DFCF', fontSize: 12 }}>{c.name}</span>
                        <span style={{ fontSize: 8, color: '#4A4540', marginLeft: 8, textTransform: 'capitalize' }}>{c.type}</span>
                      </ResultRow>
                    );
                  })}
                </Section>
              )}

              {results && results.projects.length > 0 && (
                <Section label="Proyectos" icon={<KanbanSquare size={10} />}>
                  {results.projects.map((p) => {
                    const idx = flat.findIndex(f => f.kind === 'project' && f.item._id === p._id);
                    return (
                      <ResultRow key={p._id} idx={idx} active={active === idx} onClick={() => navigate_to(p.href)} onHover={() => setActive(idx)}>
                        <span style={{ color: '#E8DFCF', fontSize: 12 }}>{p.name}</span>
                        {p.address1 && <span style={{ fontSize: 8, color: '#7A7068', marginLeft: 8 }}>{p.address1}</span>}
                        <span style={{ fontSize: 7, color: '#4A4540', marginLeft: 'auto', textTransform: 'uppercase', letterSpacing: '0.12em' }}>{STATUS_LABEL[p.status] ?? p.status}</span>
                      </ResultRow>
                    );
                  })}
                </Section>
              )}

              {results && results.documents.length > 0 && (
                <Section label="Documentos" icon={<FileText size={10} />}>
                  {results.documents.map((d) => {
                    const idx = flat.findIndex(f => f.kind === 'document' && f.item._id === d._id);
                    return (
                      <ResultRow key={d._id} idx={idx} active={active === idx} onClick={() => navigate_to(d.href)} onHover={() => setActive(idx)}>
                        <span style={{ color: '#E8DFCF', fontSize: 12 }}>{d.title}</span>
                        <span style={{ fontSize: 7, color: '#4A4540', marginLeft: 8, textTransform: 'uppercase', letterSpacing: '0.12em' }}>{d.templateId}</span>
                      </ResultRow>
                    );
                  })}
                </Section>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        {total > 0 && (
          <div style={{ padding: '8px 16px', borderTop: '1px solid #2A2520', display: 'flex', gap: 16, fontSize: 8, color: '#4A4540' }}>
            <span>↑↓ navegar</span>
            <span>↵ abrir</span>
            <span>esc cerrar</span>
            <span style={{ marginLeft: 'auto' }}>{total} resultado{total !== 1 ? 's' : ''}</span>
          </div>
        )}
      </div>
    </>
  );
}

function Section({ label, icon, children }: { label: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px 4px', fontSize: 7, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#4A4540' }}>
        {icon} {label}
      </div>
      {children}
    </div>
  );
}

function ResultRow({ idx, active, onClick, onHover, children }: {
  idx: number; active: boolean; onClick: () => void; onHover: () => void; children: React.ReactNode;
}) {
  return (
    <button
      data-idx={idx}
      onClick={onClick}
      onMouseEnter={onHover}
      style={{
        display: 'flex', alignItems: 'center', gap: 0,
        width: '100%', padding: '10px 16px',
        background: active ? '#252118' : 'transparent',
        border: 'none',
        borderLeft: active ? '2px solid #B95D34' : '2px solid transparent',
        cursor: 'pointer', textAlign: 'left',
        fontFamily: "'IBM Plex Mono', monospace",
      }}
    >
      {children}
    </button>
  );
}
