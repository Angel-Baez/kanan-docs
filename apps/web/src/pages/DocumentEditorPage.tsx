import { useEffect, useState } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { Loader2, ArrowLeft, Printer, FileDown, Check } from 'lucide-react';
import type { KananDocument, ThemeMode } from '@kanan/shared';
import { api } from '../api/client.ts';
import { DocumentProvider, useDocument } from '../context/DocumentContext.tsx';
import { useTheme } from '../context/ThemeContext.tsx';
import { TemplateResolver } from '../templates/TemplateResolver.tsx';
import { KananIsotipo } from '../components/brand/KananIsotipo.tsx';
import { TEMPLATE_META } from '../templates/registry.ts';

// ── Design tokens ────────────────────────────────────────────────────────────
const T = {
  bg:      '#0F0D0B',
  surface: '#1A1714',
  card:    '#221E19',
  border:  '#332E28',
  text:    '#E8DFCF',
  muted:   '#7A7068',
  dim:     '#4A4540',
  accent:  '#C4673A',
  saved:   '#7A8C47',
} as const;

// ── Injected CSS: doc shadow + canvas bg ─────────────────────────────────────
const EDITOR_STYLES = `
@keyframes kEditorIn {
  from { opacity: 0; transform: translateY(5px); }
  to   { opacity: 1; transform: translateY(0); }
}
.k-editor-canvas { animation: kEditorIn 0.3s ease both; }
.k-editor-canvas .kanan-canvas .doc {
  box-shadow: 0 6px 40px rgba(0, 0, 0, 0.42), 0 2px 8px rgba(0, 0, 0, 0.28);
}
`;

const THEME_MODES: { id: ThemeMode; name: string; desc: string }[] = [
  { id: 'base',  name: 'Base',   desc: 'Silencioso'  },
  { id: 't',     name: 'Modo T', desc: 'Residencial' },
  { id: 'o',     name: 'Modo O', desc: 'Comercial'   },
  { id: 'plena', name: 'Plena',  desc: 'Bicolor'     },
];

// ── Editor shell (requires DocumentContext) ───────────────────────────────────
function EditorShell({ doc }: { doc: KananDocument }) {
  const { saveStatus } = useDocument();
  const { theme, setTheme } = useTheme();

  // Apply the document's saved theme on mount only
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { setTheme(doc.theme); }, []);

  const handleThemeChange = (t: ThemeMode) => {
    setTheme(t);
    api.documents.patchMeta(doc._id, { theme: t }).catch(console.error);
  };

  const meta = TEMPLATE_META[doc.templateId];
  const isSaving = saveStatus === 'saving';
  const isSaved  = saveStatus === 'saved';

  return (
    <div style={{ background: T.bg, minHeight: '100vh', display: 'flex', flexDirection: 'column', fontFamily: "'IBM Plex Mono', monospace" }}>
      <style>{EDITOR_STYLES}</style>

      {/* ── Toolbar ───────────────────────────────────────────────────── */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 20,
        background: T.bg,
        borderBottom: `1px solid ${T.border}`,
        display: 'flex', alignItems: 'stretch',
        height: 48, flexShrink: 0,
      }}>
        {/* ← KANAN */}
        <Link
          to="/"
          style={{
            display: 'flex', alignItems: 'center', gap: 9,
            padding: '0 20px',
            color: T.muted, textDecoration: 'none',
            borderRight: `1px solid ${T.border}`,
            transition: 'color 0.12s', flexShrink: 0,
          }}
          onMouseEnter={e => (e.currentTarget.style.color = T.text)}
          onMouseLeave={e => (e.currentTarget.style.color = T.muted)}
        >
          <ArrowLeft size={12} />
          <span style={{
            fontFamily: 'Archivo, sans-serif', fontWeight: 900,
            fontSize: 13, letterSpacing: '0.24em', color: T.text,
          }}>
            KANAN
          </span>
        </Link>

        {/* Doc identity */}
        <div style={{
          flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center',
          padding: '0 20px', overflow: 'hidden', borderRight: `1px solid ${T.border}`,
        }}>
          {meta && (
            <span style={{ fontSize: 8, letterSpacing: '0.22em', textTransform: 'uppercase', color: T.muted, display: 'block', marginBottom: 2 }}>
              {meta.docType}
            </span>
          )}
          <span style={{ fontSize: 11, color: T.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>
            {doc.title}
          </span>
        </div>

        {/* Save status */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
          padding: '0 16px', minWidth: 100, flexShrink: 0,
          borderRight: `1px solid ${T.border}`,
        }}>
          {isSaving && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 9, color: T.muted, letterSpacing: '0.1em' }}>
              <Loader2 size={10} className="animate-spin" />
              Guardando
            </span>
          )}
          {isSaved && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 9, color: T.saved, letterSpacing: '0.1em' }}>
              <Check size={10} />
              Guardado
            </span>
          )}
        </div>

        {/* Print */}
        <button
          onClick={() => window.print()}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '0 18px',
            color: T.muted, background: 'none', border: 'none',
            borderRight: `1px solid ${T.border}`,
            cursor: 'pointer',
            fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase',
            fontFamily: "'IBM Plex Mono', monospace",
            transition: 'color 0.12s', flexShrink: 0,
          }}
          onMouseEnter={e => (e.currentTarget.style.color = T.text)}
          onMouseLeave={e => (e.currentTarget.style.color = T.muted)}
        >
          <Printer size={12} />
          Imprimir
        </button>

        {/* PDF */}
        <button
          onClick={() => window.open(api.documents.pdfUrl(doc._id), '_blank')}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '0 22px',
            color: '#FFF8F0', background: T.accent, border: 'none',
            cursor: 'pointer',
            fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase',
            fontFamily: "'IBM Plex Mono', monospace", fontWeight: 700,
            transition: 'opacity 0.14s', flexShrink: 0,
          }}
          onMouseEnter={e => (e.currentTarget.style.opacity = '0.82')}
          onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
        >
          <FileDown size={13} />
          PDF
        </button>
      </header>

      {/* ── Theme strip ───────────────────────────────────────────────── */}
      <div style={{
        display: 'flex',
        background: T.surface,
        borderBottom: `1px solid ${T.border}`,
        flexShrink: 0,
        overflowX: 'auto',
      }}>
        {THEME_MODES.map(m => {
          const active = theme === m.id;
          return (
            <button
              key={m.id}
              onClick={() => handleThemeChange(m.id)}
              style={{
                flex: 1, minWidth: 110,
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 16px',
                background: active ? T.card : 'transparent',
                border: 'none',
                borderRight: `1px solid ${T.border}`,
                borderBottom: active ? `2px solid ${T.accent}` : '2px solid transparent',
                cursor: 'pointer',
                transition: 'background 0.14s, border-color 0.14s',
                textAlign: 'left',
                fontFamily: "'IBM Plex Mono', monospace",
              }}
              onMouseEnter={e => { if (!active) e.currentTarget.style.background = `${T.card}88`; }}
              onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}
            >
              <KananIsotipo mode={m.id} size={12} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2, overflow: 'hidden' }}>
                <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: active ? T.text : T.muted, whiteSpace: 'nowrap' }}>
                  {m.name}
                </span>
                <span style={{ fontSize: 8, color: T.dim, letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>
                  {m.desc}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* ── Document canvas ───────────────────────────────────────────── */}
      {/* Dark desk; the .doc inside kanan-canvas keeps its own cream background */}
      <div className="k-editor-canvas" style={{ flex: 1, background: T.bg }}>
        <div className="kanan-canvas">
          <main>
            <TemplateResolver templateId={doc.templateId} />
          </main>
        </div>
      </div>
    </div>
  );
}

// ── Print-only shell: canvas bare, zero chrome (used by Puppeteer ?print=1) ──
function PrintShell({ doc }: { doc: KananDocument }) {
  const { setTheme } = useTheme();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { setTheme(doc.theme); }, []);

  return (
    <div className="kanan-canvas">
      <main>
        <TemplateResolver templateId={doc.templateId} />
      </main>
    </div>
  );
}

// ── Page entry ────────────────────────────────────────────────────────────────
export function DocumentEditorPage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const isPrint = searchParams.get('print') === '1';

  const [doc, setDoc]   = useState<KananDocument | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    api.documents.get(id)
      .then(d => setDoc(d as KananDocument))
      .catch((e: Error) => setError(e.message));
  }, [id]);

  // ── Loading ────────────────────────────────────────────────────────
  if (!doc && !error) return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      gap: 10, minHeight: '100vh',
      background: isPrint ? '#F3EDE3' : '#0F0D0B',
      color: '#7A7068', fontFamily: "'IBM Plex Mono', monospace", fontSize: 11,
    }}>
      <Loader2 size={14} className="animate-spin" />
    </div>
  );

  // ── Error ──────────────────────────────────────────────────────────
  if (error) return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexDirection: 'column', gap: 16, minHeight: '100vh',
      background: '#0F0D0B',
      fontFamily: "'IBM Plex Mono', monospace",
    }}>
      <p style={{ fontSize: 11, color: '#C4673A', letterSpacing: '0.08em' }}>
        Error: {error}
      </p>
      <Link
        to="/"
        style={{ fontSize: 10, color: '#7A7068', textDecoration: 'none', letterSpacing: '0.1em', display: 'flex', alignItems: 'center', gap: 6 }}
      >
        <ArrowLeft size={12} />
        Volver
      </Link>
    </div>
  );

  return (
    <DocumentProvider initial={doc!}>
      {isPrint ? <PrintShell doc={doc!} /> : <EditorShell doc={doc!} />}
    </DocumentProvider>
  );
}
