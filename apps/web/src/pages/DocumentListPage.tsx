import { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Plus, Trash2, FileText, Loader2, X, Search,
  Layers, LayoutGrid, List, ExternalLink, ChevronLeft, User,
} from 'lucide-react';
import { api } from '../api/client.ts';
import { TEMPLATE_META, PHASES } from '../templates/registry.ts';
import { ThemeSwitcher } from '../components/nav/ThemeSwitcher.tsx';
import { AppNav } from '../components/nav/AppNav.tsx';
import { useToast } from '../context/ToastContext.tsx';
import type { KananDocument, KananClient, KananProject, TemplateId } from '@kanan/shared';

// ── Design tokens ────────────────────────────────────────────────────────────
const T = {
  bg:       '#0F0D0B',
  surface:  '#1A1714',
  card:     '#221E19',
  cardHov:  '#2A2520',
  border:   '#332E28',
  text:     '#E8DFCF',
  muted:    '#7A7068',
  dim:      '#4A4540',
  accent:   '#C4673A',
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

const STYLES = `
@keyframes kFadeUp {
  from { opacity: 0; transform: translateY(6px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes kModalIn {
  from { opacity: 0; transform: scale(0.975) translateY(10px); }
  to   { opacity: 1; transform: scale(1) translateY(0); }
}
.k-row  { animation: kFadeUp 0.22s ease both; }
.k-modal { animation: kModalIn 0.18s ease both; }
.k-row:hover .k-del { opacity: 1 !important; }
`;

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-DO', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

// ── Extract client/project info from populated doc ────────────────────────────
function docMeta(doc: KananDocument) {
  const f = doc.fields as unknown as Record<string, string>;
  const proj = typeof doc.projectId === 'object' ? doc.projectId : null;
  return {
    clientName:  f['clientName']?.trim() || f['contracteeName']?.trim() || '',
    projectName: proj?.name ?? '',
    clientId:    proj?.clientId ?? '',
    projectId:   proj?._id ?? (typeof doc.projectId === 'string' ? doc.projectId : ''),
  };
}

// ── Sub-components ───────────────────────────────────────────────────────────
type NavFn = ReturnType<typeof useNavigate>;
type DelFn = (doc: KananDocument, e: React.MouseEvent) => void;

function DocListRow({ doc, index, navigate, requestDelete }: {
  doc: KananDocument; index: number; navigate: NavFn; requestDelete: DelFn;
}) {
  const meta = TEMPLATE_META[doc.templateId];
  const { clientName, projectName, clientId, projectId } = docMeta(doc);
  const phaseColor = PHASE_COLOR[meta?.phase ?? ''] ?? T.accent;

  return (
    <div
      className="k-row"
      style={{
        animationDelay: `${Math.min(index * 25, 350)}ms`,
        display: 'flex', alignItems: 'center',
        background: T.card,
        borderLeft: `2px solid ${phaseColor}`,
        cursor: 'pointer',
        transition: 'background 0.12s',
        position: 'relative',
      }}
      onClick={() => navigate(`/documents/${doc._id}`)}
      onMouseEnter={e => (e.currentTarget.style.background = T.cardHov)}
      onMouseLeave={e => (e.currentTarget.style.background = T.card)}
    >
      <div style={{ width: 52, flexShrink: 0, padding: '13px 0 13px 14px' }}>
        <span style={{ fontSize: 8, letterSpacing: '0.15em', textTransform: 'uppercase', color: phaseColor, fontWeight: 700 }}>
          {meta?.label ?? doc.templateId}
        </span>
      </div>

      <div style={{ flex: '0 0 210px', padding: '13px 16px', overflow: 'hidden' }}>
        <p style={{ fontSize: 11, color: T.text, letterSpacing: '0.02em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: 0 }}>
          {doc.title}
        </p>
      </div>

      <div style={{ flex: 1, overflow: 'hidden', padding: '13px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }} onClick={e => e.stopPropagation()}>
          {clientName && (
            clientId ? (
              <Link to={`/clients/${clientId}`}
                style={{ fontSize: 10, color: T.muted, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 3, transition: 'color 0.12s', whiteSpace: 'nowrap' }}
                onMouseEnter={e => (e.currentTarget.style.color = T.accent)}
                onMouseLeave={e => (e.currentTarget.style.color = T.muted)}
              >
                {clientName}<ExternalLink size={8} style={{ opacity: 0.5 }} />
              </Link>
            ) : (
              <span style={{ fontSize: 10, color: T.muted, whiteSpace: 'nowrap' }}>{clientName}</span>
            )
          )}
          {clientName && projectName && <span style={{ fontSize: 10, color: T.dim }}>·</span>}
          {projectName && (
            projectId ? (
              <Link to={`/projects/${projectId}`}
                style={{ fontSize: 10, color: T.dim, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 3, transition: 'color 0.12s', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                onMouseEnter={e => (e.currentTarget.style.color = T.muted)}
                onMouseLeave={e => (e.currentTarget.style.color = T.dim)}
                onClick={e => e.stopPropagation()}
              >
                {projectName}<ExternalLink size={8} style={{ opacity: 0.4 }} />
              </Link>
            ) : (
              <span style={{ fontSize: 10, color: T.dim, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{projectName}</span>
            )
          )}
        </div>
      </div>

      <div style={{ padding: '13px 16px', flexShrink: 0 }}>
        <span style={{ fontSize: 9, color: T.dim, letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>
          {formatDate(doc.updatedAt)}
        </span>
      </div>

      <div style={{ padding: '0 12px 0 4px', flexShrink: 0 }}>
        <button
          className="k-del"
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.dim, padding: '6px', opacity: 0, transition: 'color 0.12s, opacity 0.12s', display: 'flex' }}
          onClick={(e) => requestDelete(doc, e)}
          onMouseEnter={e => (e.currentTarget.style.color = T.accent)}
          onMouseLeave={e => (e.currentTarget.style.color = T.dim)}
        >
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  );
}

function DocGridCard({ doc, index, navigate, requestDelete }: {
  doc: KananDocument; index: number; navigate: NavFn; requestDelete: DelFn;
}) {
  const meta = TEMPLATE_META[doc.templateId];
  const { clientName, projectName } = docMeta(doc);
  const phaseColor = PHASE_COLOR[meta?.phase ?? ''] ?? T.accent;

  return (
    <div
      className="k-row"
      style={{
        animationDelay: `${Math.min(index * 35, 420)}ms`,
        background: T.card,
        borderLeft: `2px solid ${phaseColor}`,
        padding: '14px 14px 12px',
        cursor: 'pointer',
        transition: 'background 0.12s',
        position: 'relative',
      }}
      onClick={() => navigate(`/documents/${doc._id}`)}
      onMouseEnter={e => {
        e.currentTarget.style.background = T.cardHov;
        const btn = e.currentTarget.querySelector<HTMLElement>('.k-del');
        if (btn) btn.style.opacity = '1';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background = T.card;
        const btn = e.currentTarget.querySelector<HTMLElement>('.k-del');
        if (btn) btn.style.opacity = '0';
      }}
    >
      <p style={{ fontSize: 8, letterSpacing: '0.15em', textTransform: 'uppercase', color: phaseColor, fontWeight: 700, marginBottom: 6, margin: '0 0 6px' }}>
        {meta?.docType ?? doc.templateId}
      </p>
      <p style={{ fontSize: 12, color: T.text, letterSpacing: '0.02em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: '6px 0 8px' }}>
        {doc.title}
      </p>
      {clientName && (
        <p style={{ fontSize: 10, color: T.muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: '0 0 2px' }}>
          {clientName}
        </p>
      )}
      {projectName && (
        <p style={{ fontSize: 10, color: T.dim, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: 0 }}>
          {projectName}
        </p>
      )}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
        <span style={{ fontSize: 9, color: T.dim }}>{formatDate(doc.updatedAt)}</span>
        <button
          className="k-del"
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.dim, padding: 4, opacity: 0, transition: 'color 0.12s, opacity 0.12s', display: 'flex' }}
          onClick={e => requestDelete(doc, e)}
          onMouseEnter={e => (e.currentTarget.style.color = T.accent)}
          onMouseLeave={e => (e.currentTarget.style.color = T.dim)}
        >
          <Trash2 size={12} />
        </button>
      </div>
    </div>
  );
}

// ── Wizard modal steps ────────────────────────────────────────────────────────
type WizardStep = 1 | 2 | 3;
type ClientType = 'residencial' | 'comercial' | 'institucional';

interface WizardState {
  step: WizardStep;
  templateId: TemplateId | null;
  client: KananClient | null;
  clients: KananClient[];
  clientProjects: KananProject[];
  loading: boolean;
  showNewClient: boolean;
  newClientName: string;
  newClientType: ClientType;
  showNewProject: boolean;
  newProjectName: string;
  submitting: boolean;
}

function initWizard(): WizardState {
  return {
    step: 1,
    templateId: null,
    client: null,
    clients: [],
    clientProjects: [],
    loading: false,
    showNewClient: false,
    newClientName: '',
    newClientType: 'residencial',
    showNewProject: false,
    newProjectName: '',
    submitting: false,
  };
}

// ── View mode type ────────────────────────────────────────────────────────────
type ViewMode = 'list' | 'grid' | 'byProject';
interface PendingDelete { id: string; title: string; }

// ── Main page ────────────────────────────────────────────────────────────────
export function DocumentListPage() {
  const [docs, setDocs]               = useState<KananDocument[]>([]);
  const [showModal, setShowModal]     = useState(false);
  const [loading, setLoading]         = useState(true);
  const [search, setSearch]           = useState('');
  const [viewMode, setViewMode]       = useState<ViewMode>('list');
  const [activeClient, setActiveClient] = useState<string | null>(null);
  const [activePhase, setActivePhase] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<PendingDelete | null>(null);
  const [deleting, setDeleting]       = useState(false);
  const [wizard, setWizard]           = useState<WizardState>(initWizard);
  const navigate = useNavigate();
  const { addToast } = useToast();

  useEffect(() => {
    api.documents.list()
      .then(d => setDocs(d as KananDocument[]))
      .catch(() => addToast('Error al cargar los documentos', 'error'))
      .finally(() => setLoading(false));
  }, []);

  const openModal = () => {
    setWizard(initWizard());
    setShowModal(true);
  };

  const closeModal = () => setShowModal(false);

  // ── Wizard: step 1 → select template ──────────────────────────────────────
  const wizardPickTemplate = async (templateId: TemplateId) => {
    setWizard(w => ({ ...w, step: 2, templateId, loading: true }));
    try {
      const clients = await api.clients.list() as KananClient[];
      setWizard(w => ({ ...w, clients, loading: false }));
    } catch {
      addToast('Error al cargar clientes', 'error');
      setWizard(w => ({ ...w, loading: false }));
    }
  };

  // ── Wizard: step 2 → select client ────────────────────────────────────────
  const wizardPickClient = async (client: KananClient) => {
    setWizard(w => ({ ...w, step: 3, client, loading: true, showNewClient: false }));
    try {
      const projects = await api.clients.projects(client._id) as KananProject[];
      setWizard(w => ({ ...w, clientProjects: projects, loading: false }));
    } catch {
      addToast('Error al cargar proyectos', 'error');
      setWizard(w => ({ ...w, loading: false }));
    }
  };

  const wizardCreateClient = async () => {
    const name = wizard.newClientName.trim();
    if (!name) return;
    setWizard(w => ({ ...w, submitting: true }));
    try {
      const client = await api.clients.create({ name, type: wizard.newClientType }) as KananClient;
      await wizardPickClient(client);
    } catch {
      addToast('Error al crear cliente', 'error');
      setWizard(w => ({ ...w, submitting: false }));
    }
  };

  // ── Wizard: step 3 → select project → create doc ──────────────────────────
  const wizardPickProject = async (project: KananProject) => {
    if (!wizard.templateId) return;
    setWizard(w => ({ ...w, submitting: true }));
    try {
      await createDoc(wizard.templateId, project._id);
    } catch {
      setWizard(w => ({ ...w, submitting: false }));
    }
  };

  const wizardCreateProject = async () => {
    const name = wizard.newProjectName.trim();
    if (!name || !wizard.client || !wizard.templateId) return;
    setWizard(w => ({ ...w, submitting: true }));
    try {
      const project = await api.projects.create({
        name,
        clientId: wizard.client._id,
        status: 'cotizando',
        preferredTheme: 'o',
      }) as KananProject;
      await createDoc(wizard.templateId, project._id);
    } catch {
      addToast('Error al crear proyecto', 'error');
      setWizard(w => ({ ...w, submitting: false }));
    }
  };

  const createDoc = async (templateId: TemplateId, projectId: string) => {
    const meta = TEMPLATE_META[templateId];
    const year = new Date().getFullYear();
    const sameType = docs.filter(d => d.templateId === templateId).length;
    const docNumber = `${meta.prefix}-${year}-${String(sameType + 1).padStart(4, '0')}`;
    const doc = await api.documents.create({
      templateId, title: docNumber, theme: 'o',
      projectId,
      fields: { ...meta.defaultFields(), docNumber },
    }) as KananDocument;
    navigate(`/documents/${doc._id}`);
  };

  const requestDelete = (doc: KananDocument, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setPendingDelete({ id: doc._id, title: doc.title });
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await api.documents.delete(pendingDelete.id);
      setDocs(prev => prev.filter(d => d._id !== pendingDelete.id));
      addToast('Documento eliminado', 'success');
    } catch {
      addToast('Error al eliminar el documento', 'error');
    } finally {
      setDeleting(false);
      setPendingDelete(null);
    }
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return docs.filter(doc => {
      const { clientName, projectName } = docMeta(doc);
      const meta = TEMPLATE_META[doc.templateId];
      return (
        (!q || doc.title.toLowerCase().includes(q) || clientName.toLowerCase().includes(q) || projectName.toLowerCase().includes(q)) &&
        (!activeClient || clientName === activeClient) &&
        (!activePhase || meta?.phase === activePhase)
      );
    });
  }, [docs, search, activeClient, activePhase]);

  const uniqueClients = useMemo(() => {
    const map = new Map<string, string>();
    docs.forEach(d => {
      const { clientName, clientId } = docMeta(d);
      if (clientName && clientId && !map.has(clientName)) map.set(clientName, clientId);
    });
    return Array.from(map.entries())
      .map(([name, clientId]) => ({ name, clientId }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [docs]);

  const grouped = useMemo(() => {
    const map = new Map<string, {
      clientName: string; projectName: string;
      clientId: string; projectId: string;
      docs: KananDocument[];
    }>();
    for (const doc of filtered) {
      const { clientName, projectName, clientId, projectId } = docMeta(doc);
      const key = projectId || `${clientName}||${projectName}`;
      if (!map.has(key)) map.set(key, { clientName, projectName, clientId, projectId, docs: [] });
      map.get(key)!.docs.push(doc);
    }
    return Array.from(map.values()).sort((a, b) => {
      if (a.clientName && !b.clientName) return -1;
      if (!a.clientName && b.clientName) return 1;
      return (a.clientName + a.projectName).localeCompare(b.clientName + b.projectName);
    });
  }, [filtered]);

  const phaseCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    docs.forEach(d => {
      const p = TEMPLATE_META[d.templateId]?.phase;
      if (p) counts[p] = (counts[p] || 0) + 1;
    });
    return counts;
  }, [docs]);

  const hasContent = !loading && docs.length > 0;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{STYLES}</style>
      <AppNav />
      <ThemeSwitcher />

      <div style={{ background: T.bg, minHeight: '100vh', color: T.text, fontFamily: "'IBM Plex Mono', monospace" }}>
        <div style={{ maxWidth: 1180, margin: '0 auto', padding: '0 24px 96px' }}>

          {/* ── Hero header ───────────────────────────────────────────── */}
          <div style={{ padding: '52px 0 36px', borderBottom: `1px solid ${T.border}` }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
              <div>
                <p style={{ fontSize: 9, letterSpacing: '0.24em', color: T.muted, textTransform: 'uppercase', marginBottom: 10, margin: '0 0 10px' }}>
                  KANAN · Sistema de Documentos
                </p>
                <h1 style={{
                  fontFamily: 'Fraunces, serif',
                  fontStyle: 'italic',
                  fontSize: 'clamp(38px, 5.5vw, 60px)',
                  fontWeight: 400,
                  color: T.text,
                  lineHeight: 1.0,
                  letterSpacing: '-0.015em',
                  margin: 0,
                }}>
                  Documentos
                </h1>
                {!loading && (
                  <p style={{ fontSize: 10, color: T.muted, marginTop: 12, letterSpacing: '0.07em', margin: '12px 0 0' }}>
                    {docs.length === 0
                      ? 'Sin archivos todavía'
                      : `${docs.length} archivo${docs.length !== 1 ? 's' : ''} · ${uniqueClients.length} cliente${uniqueClients.length !== 1 ? 's' : ''}`}
                  </p>
                )}
              </div>

              <button
                onClick={openModal}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  background: T.accent, color: '#FFF8F0',
                  border: 'none', cursor: 'pointer',
                  padding: '11px 22px',
                  fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase',
                  fontFamily: "'IBM Plex Mono', monospace", fontWeight: 700,
                  transition: 'opacity 0.15s',
                }}
                onMouseEnter={e => (e.currentTarget.style.opacity = '0.82')}
                onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
              >
                <Plus size={13} />
                Nuevo documento
              </button>
            </div>
          </div>

          {/* ── Phase filter ──────────────────────────────────────────── */}
          {hasContent && (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', padding: '18px 0', borderBottom: `1px solid ${T.border}` }}>
              <button
                onClick={() => setActivePhase(null)}
                style={{
                  padding: '4px 12px',
                  fontSize: 8, letterSpacing: '0.18em', textTransform: 'uppercase',
                  fontFamily: "'IBM Plex Mono', monospace",
                  border: `1px solid ${activePhase === null ? T.accent : T.border}`,
                  background: activePhase === null ? `${T.accent}18` : 'transparent',
                  color: activePhase === null ? T.accent : T.muted,
                  cursor: 'pointer', transition: 'all 0.14s',
                }}
              >
                Todos · {docs.length}
              </button>

              {PHASES.filter(p => phaseCounts[p.id]).map(phase => {
                const c = PHASE_COLOR[phase.id];
                const active = activePhase === phase.id;
                return (
                  <button
                    key={phase.id}
                    onClick={() => setActivePhase(active ? null : phase.id)}
                    style={{
                      padding: '4px 12px',
                      fontSize: 8, letterSpacing: '0.18em', textTransform: 'uppercase',
                      fontFamily: "'IBM Plex Mono', monospace",
                      border: `1px solid ${active ? c : T.border}`,
                      background: active ? `${c}18` : 'transparent',
                      color: active ? c : T.muted,
                      cursor: 'pointer', transition: 'all 0.14s',
                    }}
                    onMouseEnter={e => { if (!active) { e.currentTarget.style.borderColor = `${c}50`; e.currentTarget.style.color = c ?? T.muted; } }}
                    onMouseLeave={e => { if (!active) { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.muted; } }}
                  >
                    {phase.label} · {phaseCounts[phase.id]}
                  </button>
                );
              })}
            </div>
          )}

          {/* ── Controls bar ──────────────────────────────────────────── */}
          {hasContent && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 0', borderBottom: `1px solid ${T.border}` }}>
              <div style={{ position: 'relative', flex: 1, maxWidth: 340 }}>
                <Search size={11} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: T.muted, pointerEvents: 'none' }} />
                <input
                  type="text"
                  placeholder="Buscar título, cliente o proyecto…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  style={{
                    width: '100%',
                    paddingLeft: 28, paddingRight: search ? 28 : 10,
                    paddingTop: 7, paddingBottom: 7,
                    fontSize: 10,
                    fontFamily: "'IBM Plex Mono', monospace",
                    background: T.surface,
                    border: `1px solid ${search ? T.accent + '60' : T.border}`,
                    color: T.text,
                    outline: 'none',
                    transition: 'border-color 0.14s',
                  }}
                  onFocus={e => (e.currentTarget.style.borderColor = `${T.accent}60`)}
                  onBlur={e => (e.currentTarget.style.borderColor = search ? `${T.accent}60` : T.border)}
                />
                {search && (
                  <button
                    onClick={() => setSearch('')}
                    style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', color: T.muted, background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex' }}
                  >
                    <X size={11} />
                  </button>
                )}
              </div>

              <div style={{ marginLeft: 'auto', display: 'flex', border: `1px solid ${T.border}` }}>
                {(['list', 'grid', 'byProject'] as ViewMode[]).map(mode => {
                  const icons = { list: <List size={13} />, grid: <LayoutGrid size={13} />, byProject: <Layers size={13} /> };
                  const titles = { list: 'Lista', grid: 'Grilla', byProject: 'Por proyecto' };
                  const active = viewMode === mode;
                  return (
                    <button
                      key={mode}
                      onClick={() => setViewMode(mode)}
                      title={titles[mode]}
                      style={{
                        padding: '7px 9px',
                        background: active ? T.accent : 'transparent',
                        color: active ? '#FFF8F0' : T.muted,
                        border: 'none', cursor: 'pointer',
                        transition: 'all 0.14s',
                        display: 'flex', alignItems: 'center',
                      }}
                    >
                      {icons[mode]}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {loading && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: T.muted, fontSize: 11, padding: '88px 0', justifyContent: 'center' }}>
              <Loader2 size={15} className="animate-spin" />
              Cargando archivos…
            </div>
          )}

          {!loading && docs.length === 0 && (
            <div style={{ textAlign: 'center', padding: '100px 0' }}>
              <div style={{
                width: 64, height: 64,
                border: `1px solid ${T.border}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 28px',
              }}>
                <FileText size={24} style={{ color: T.dim }} />
              </div>
              <p style={{ fontSize: 11, color: T.muted, letterSpacing: '0.1em', marginBottom: 28 }}>
                No hay documentos todavía
              </p>
              <button
                onClick={openModal}
                style={{
                  background: 'transparent',
                  border: `1px solid ${T.accent}`,
                  color: T.accent, cursor: 'pointer',
                  padding: '9px 22px',
                  fontSize: 9, letterSpacing: '0.16em', textTransform: 'uppercase',
                  fontFamily: "'IBM Plex Mono', monospace",
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  transition: 'background 0.15s',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = `${T.accent}15`)}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <Plus size={12} />
                Crear el primero
              </button>
            </div>
          )}

          {hasContent && filtered.length === 0 && (
            <p style={{ color: T.muted, fontSize: 11, padding: '52px 0', textAlign: 'center', letterSpacing: '0.07em' }}>
              Sin resultados para "{search || activeClient || activePhase}"
            </p>
          )}

          {hasContent && filtered.length > 0 && (
            <div style={{ display: 'flex', gap: 36, paddingTop: 28 }}>

              {uniqueClients.length > 1 && (
                <aside style={{ width: 156, flexShrink: 0 }}>
                  <p style={{ fontSize: 8, letterSpacing: '0.24em', color: T.muted, textTransform: 'uppercase', margin: '0 0 12px' }}>
                    Clientes
                  </p>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <li>
                      <button
                        onClick={() => setActiveClient(null)}
                        style={{
                          width: '100%', textAlign: 'left',
                          fontSize: 10, fontFamily: "'IBM Plex Mono', monospace",
                          padding: '5px 9px',
                          background: activeClient === null ? `${T.accent}15` : 'transparent',
                          color: activeClient === null ? T.accent : T.muted,
                          border: `1px solid ${activeClient === null ? T.accent + '40' : 'transparent'}`,
                          cursor: 'pointer', transition: 'all 0.12s',
                        }}
                      >
                        Todos
                      </button>
                    </li>
                    {uniqueClients.map(({ name, clientId }) => (
                      <li key={name} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <button
                          onClick={() => setActiveClient(activeClient === name ? null : name)}
                          style={{
                            flex: 1, textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                            fontSize: 10, fontFamily: "'IBM Plex Mono', monospace",
                            padding: '5px 9px',
                            background: activeClient === name ? `${T.accent}15` : 'transparent',
                            color: activeClient === name ? T.accent : T.muted,
                            border: `1px solid ${activeClient === name ? T.accent + '40' : 'transparent'}`,
                            cursor: 'pointer', transition: 'all 0.12s',
                          }}
                          onMouseEnter={e => { if (activeClient !== name) e.currentTarget.style.color = T.text; }}
                          onMouseLeave={e => { if (activeClient !== name) e.currentTarget.style.color = T.muted; }}
                        >
                          {name}
                        </button>
                        <Link
                          to={`/clients/${clientId}`}
                          title="Ver perfil"
                          style={{ color: T.dim, flexShrink: 0, display: 'flex', transition: 'color 0.12s' }}
                          onMouseEnter={e => (e.currentTarget.style.color = T.accent)}
                          onMouseLeave={e => (e.currentTarget.style.color = T.dim)}
                        >
                          <ExternalLink size={9} />
                        </Link>
                      </li>
                    ))}
                  </ul>
                </aside>
              )}

              <div style={{ flex: 1, minWidth: 0 }}>
                {viewMode === 'list' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {filtered.map((doc, i) => (
                      <DocListRow key={doc._id} doc={doc} index={i} navigate={navigate} requestDelete={requestDelete} />
                    ))}
                  </div>
                )}

                {viewMode === 'grid' && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: 8 }}>
                    {filtered.map((doc, i) => (
                      <DocGridCard key={doc._id} doc={doc} index={i} navigate={navigate} requestDelete={requestDelete} />
                    ))}
                  </div>
                )}

                {viewMode === 'byProject' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 36 }}>
                    {grouped.map(({ clientName, projectName, clientId, projectId, docs: groupDocs }) => (
                      <div key={projectId || `${clientName}||${projectName}`}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                          <span style={{ fontSize: 9, letterSpacing: '0.16em', textTransform: 'uppercase', color: T.text, display: 'flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap' }}>
                            {clientName && clientId ? (
                              <Link to={`/clients/${clientId}`}
                                style={{ color: 'inherit', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4, transition: 'color 0.12s' }}
                                onMouseEnter={e => (e.currentTarget.style.color = T.accent)}
                                onMouseLeave={e => (e.currentTarget.style.color = T.text)}
                              >
                                {clientName}<ExternalLink size={8} style={{ opacity: 0.5 }} />
                              </Link>
                            ) : clientName}
                            {clientName && projectName && <span style={{ color: T.dim }}>·</span>}
                            {projectName && projectId ? (
                              <Link to={`/projects/${projectId}`}
                                style={{ color: T.muted, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4, transition: 'color 0.12s' }}
                                onMouseEnter={e => (e.currentTarget.style.color = T.accent)}
                                onMouseLeave={e => (e.currentTarget.style.color = T.muted)}
                              >
                                {projectName}<ExternalLink size={8} style={{ opacity: 0.4 }} />
                              </Link>
                            ) : (
                              <span style={{ color: T.muted }}>{projectName || 'Sin proyecto asignado'}</span>
                            )}
                          </span>
                          <span style={{ fontSize: 9, color: T.dim }}>
                            {groupDocs.length} doc{groupDocs.length !== 1 ? 's' : ''}
                          </span>
                          <div style={{ flex: 1, borderTop: `1px solid ${T.border}` }} />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                          {groupDocs.map((doc, i) => (
                            <DocListRow key={doc._id} doc={doc} index={i} navigate={navigate} requestDelete={requestDelete} />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── New document wizard modal ──────────────────────────────────────── */}
      {showModal && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(8, 6, 4, 0.88)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, backdropFilter: 'blur(6px)' }}
          onClick={closeModal}
        >
          <div
            className="k-modal"
            style={{
              background: T.surface,
              border: `1px solid ${T.border}`,
              maxWidth: 700, width: '100%',
              maxHeight: '90vh',
              display: 'flex', flexDirection: 'column',
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '26px 30px 20px', borderBottom: `1px solid ${T.border}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                {wizard.step > 1 && (
                  <button
                    onClick={() => setWizard(w => ({ ...w, step: (w.step - 1) as WizardStep, showNewClient: false, showNewProject: false }))}
                    style={{ color: T.muted, background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex', transition: 'color 0.12s' }}
                    onMouseEnter={e => (e.currentTarget.style.color = T.text)}
                    onMouseLeave={e => (e.currentTarget.style.color = T.muted)}
                  >
                    <ChevronLeft size={18} />
                  </button>
                )}
                <div>
                  <h2 style={{ fontFamily: 'Fraunces, serif', fontStyle: 'italic', fontSize: 22, fontWeight: 400, color: T.text, margin: '0 0 3px' }}>
                    {wizard.step === 1 && 'Nuevo documento'}
                    {wizard.step === 2 && 'Seleccionar cliente'}
                    {wizard.step === 3 && 'Seleccionar proyecto'}
                  </h2>
                  <p style={{ fontSize: 9, color: T.muted, margin: 0, letterSpacing: '0.06em' }}>
                    {wizard.step === 1 && 'Elige el tipo de documento'}
                    {wizard.step === 2 && (wizard.templateId ? `Template: ${TEMPLATE_META[wizard.templateId]?.docType}` : '')}
                    {wizard.step === 3 && wizard.client && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <User size={9} style={{ color: T.dim }} />
                        {wizard.client.name}
                      </span>
                    )}
                  </p>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                {/* Step indicator */}
                <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
                  {[1, 2, 3].map(s => (
                    <div key={s} style={{
                      width: s === wizard.step ? 18 : 6, height: 4,
                      background: s === wizard.step ? T.accent : s < wizard.step ? `${T.accent}55` : T.border,
                      transition: 'all 0.2s',
                    }} />
                  ))}
                </div>
                <button
                  onClick={closeModal}
                  style={{ color: T.muted, background: 'none', border: 'none', cursor: 'pointer', padding: 6, display: 'flex', transition: 'color 0.12s' }}
                  onMouseEnter={e => (e.currentTarget.style.color = T.text)}
                  onMouseLeave={e => (e.currentTarget.style.color = T.muted)}
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Body */}
            <div style={{ overflowY: 'auto', flex: 1 }}>

              {/* ── Step 1: Pick template ───────────────────────────── */}
              {wizard.step === 1 && (
                <div style={{ padding: '22px 30px 28px', display: 'flex', flexDirection: 'column', gap: 22 }}>
                  {PHASES.map(phase => {
                    const phaseDocs = Object.values(TEMPLATE_META).filter(m => m.phase === phase.id);
                    const c = PHASE_COLOR[phase.id];
                    return (
                      <div key={phase.id}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                          <span style={{ width: 3, height: 14, background: c, flexShrink: 0, borderRadius: 1 }} />
                          <span style={{ fontSize: 8, letterSpacing: '0.2em', textTransform: 'uppercase', color: c, fontWeight: 700 }}>
                            {phase.label}
                          </span>
                          <span style={{ fontSize: 9, color: T.muted }}>{phase.description}</span>
                          <div style={{ flex: 1, borderTop: `1px solid ${T.border}` }} />
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, paddingLeft: 13 }}>
                          {phaseDocs.map(m => (
                            <button
                              key={m.id}
                              onClick={() => void wizardPickTemplate(m.id)}
                              style={{
                                display: 'flex', alignItems: 'center', gap: 10,
                                padding: '8px 14px',
                                background: T.card,
                                border: `1px solid ${T.border}`,
                                color: T.text, cursor: 'pointer',
                                fontFamily: "'IBM Plex Mono', monospace",
                                transition: 'all 0.12s',
                                textAlign: 'left',
                              }}
                              onMouseEnter={e => {
                                e.currentTarget.style.borderColor = `${c}70`;
                                e.currentTarget.style.background = `${c}0D`;
                              }}
                              onMouseLeave={e => {
                                e.currentTarget.style.borderColor = T.border;
                                e.currentTarget.style.background = T.card;
                              }}
                            >
                              <span style={{ fontSize: 8, color: c, letterSpacing: '0.15em', textTransform: 'uppercase', fontWeight: 700, minWidth: 26 }}>
                                {m.label}
                              </span>
                              <span style={{ fontSize: 11, color: T.text }}>
                                {m.docType}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* ── Step 2: Pick / create client ────────────────────── */}
              {wizard.step === 2 && (
                <div style={{ padding: '22px 30px 28px' }}>
                  {wizard.loading ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: T.muted, fontSize: 11, padding: '32px 0' }}>
                      <Loader2 size={14} className="animate-spin" />
                      Cargando clientes…
                    </div>
                  ) : (
                    <>
                      {/* Existing clients */}
                      {wizard.clients.length > 0 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 1, marginBottom: 16 }}>
                          {wizard.clients.map(c => (
                            <button
                              key={c._id}
                              onClick={() => void wizardPickClient(c)}
                              style={{
                                display: 'flex', alignItems: 'center', gap: 12,
                                padding: '12px 14px',
                                background: T.card, border: `1px solid ${T.border}`,
                                color: T.text, cursor: 'pointer', textAlign: 'left',
                                fontFamily: "'IBM Plex Mono', monospace",
                                transition: 'all 0.12s',
                              }}
                              onMouseEnter={e => { e.currentTarget.style.background = T.cardHov; e.currentTarget.style.borderColor = `${T.accent}40`; }}
                              onMouseLeave={e => { e.currentTarget.style.background = T.card; e.currentTarget.style.borderColor = T.border; }}
                            >
                              <User size={13} style={{ color: T.dim, flexShrink: 0 }} />
                              <span style={{ flex: 1, fontSize: 12 }}>{c.name}</span>
                              <span style={{
                                fontSize: 8, letterSpacing: '0.14em', textTransform: 'uppercase',
                                color: c.type === 'residencial' ? T.accent : c.type === 'comercial' ? '#7A8C47' : '#C9AA71',
                              }}>
                                {c.type}
                              </span>
                            </button>
                          ))}
                        </div>
                      )}

                      {/* New client form */}
                      {!wizard.showNewClient ? (
                        <button
                          onClick={() => setWizard(w => ({ ...w, showNewClient: true }))}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 8,
                            padding: '10px 14px', width: '100%',
                            background: 'transparent', border: `1px dashed ${T.border}`,
                            color: T.muted, cursor: 'pointer',
                            fontFamily: "'IBM Plex Mono', monospace",
                            fontSize: 10, letterSpacing: '0.1em',
                            transition: 'all 0.12s',
                          }}
                          onMouseEnter={e => { e.currentTarget.style.borderColor = `${T.accent}50`; e.currentTarget.style.color = T.accent; }}
                          onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.muted; }}
                        >
                          <Plus size={12} />
                          Nuevo cliente
                        </button>
                      ) : (
                        <div style={{ border: `1px solid ${T.accent}35`, padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
                          <p style={{ fontSize: 9, color: T.accent, letterSpacing: '0.14em', textTransform: 'uppercase', margin: 0, fontWeight: 700 }}>
                            Nuevo cliente
                          </p>
                          <input
                            autoFocus
                            type="text"
                            placeholder="Nombre del cliente"
                            value={wizard.newClientName}
                            onChange={e => setWizard(w => ({ ...w, newClientName: e.target.value }))}
                            onKeyDown={e => { if (e.key === 'Enter') void wizardCreateClient(); }}
                            style={{
                              width: '100%', padding: '8px 10px', fontSize: 11,
                              fontFamily: "'IBM Plex Mono', monospace",
                              background: T.card, border: `1px solid ${T.border}`,
                              color: T.text, outline: 'none', boxSizing: 'border-box',
                            }}
                          />
                          <div style={{ display: 'flex', gap: 6 }}>
                            {(['residencial', 'comercial', 'institucional'] as ClientType[]).map(t => (
                              <button
                                key={t}
                                onClick={() => setWizard(w => ({ ...w, newClientType: t }))}
                                style={{
                                  flex: 1, padding: '6px 8px', fontSize: 8,
                                  letterSpacing: '0.12em', textTransform: 'uppercase',
                                  fontFamily: "'IBM Plex Mono', monospace",
                                  background: wizard.newClientType === t ? `${T.accent}18` : 'transparent',
                                  border: `1px solid ${wizard.newClientType === t ? T.accent : T.border}`,
                                  color: wizard.newClientType === t ? T.accent : T.muted,
                                  cursor: 'pointer', transition: 'all 0.12s',
                                }}
                              >
                                {t}
                              </button>
                            ))}
                          </div>
                          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                            <button
                              onClick={() => setWizard(w => ({ ...w, showNewClient: false, newClientName: '' }))}
                              style={{ fontSize: 10, color: T.muted, background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'IBM Plex Mono', monospace" }}
                            >
                              Cancelar
                            </button>
                            <button
                              disabled={!wizard.newClientName.trim() || wizard.submitting}
                              onClick={() => void wizardCreateClient()}
                              style={{
                                display: 'flex', alignItems: 'center', gap: 6,
                                padding: '7px 16px', fontSize: 9,
                                letterSpacing: '0.12em', textTransform: 'uppercase',
                                fontFamily: "'IBM Plex Mono', monospace", fontWeight: 700,
                                background: T.accent, color: '#FFF8F0',
                                border: 'none', cursor: wizard.newClientName.trim() ? 'pointer' : 'not-allowed',
                                opacity: wizard.newClientName.trim() ? 1 : 0.4,
                                transition: 'opacity 0.12s',
                              }}
                            >
                              {wizard.submitting ? <Loader2 size={11} className="animate-spin" /> : <Plus size={11} />}
                              Crear
                            </button>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* ── Step 3: Pick / create project ───────────────────── */}
              {wizard.step === 3 && (
                <div style={{ padding: '22px 30px 28px' }}>
                  {wizard.loading ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: T.muted, fontSize: 11, padding: '32px 0' }}>
                      <Loader2 size={14} className="animate-spin" />
                      Cargando proyectos…
                    </div>
                  ) : (
                    <>
                      {wizard.clientProjects.length > 0 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 1, marginBottom: 16 }}>
                          {wizard.clientProjects.map(p => {
                            const statusColor: Record<string, string> = {
                              cotizando: '#C9AA71', activo: '#7A8C47',
                              completado: '#9CAA72', garantia: '#C4673A',
                            };
                            const sc = statusColor[p.status] ?? T.muted;
                            return (
                              <button
                                key={p._id}
                                onClick={() => void wizardPickProject(p)}
                                disabled={wizard.submitting}
                                style={{
                                  display: 'flex', alignItems: 'center', gap: 12,
                                  padding: '12px 14px',
                                  background: T.card,
                                  borderLeft: `2px solid ${sc}`,
                                  border: `1px solid ${T.border}`,
                                  color: T.text, cursor: wizard.submitting ? 'not-allowed' : 'pointer',
                                  textAlign: 'left', fontFamily: "'IBM Plex Mono', monospace",
                                  transition: 'all 0.12s', opacity: wizard.submitting ? 0.5 : 1,
                                }}
                                onMouseEnter={e => { if (!wizard.submitting) { e.currentTarget.style.background = T.cardHov; e.currentTarget.style.borderColor = `${T.accent}40`; } }}
                                onMouseLeave={e => { e.currentTarget.style.background = T.card; e.currentTarget.style.borderColor = T.border; }}
                              >
                                <span style={{ fontSize: 8, color: sc, letterSpacing: '0.12em', textTransform: 'uppercase', flexShrink: 0, minWidth: 68, fontWeight: 700 }}>
                                  {p.status}
                                </span>
                                <span style={{ flex: 1, fontSize: 12 }}>{p.name}</span>
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {!wizard.showNewProject ? (
                        <button
                          onClick={() => setWizard(w => ({ ...w, showNewProject: true }))}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 8,
                            padding: '10px 14px', width: '100%',
                            background: 'transparent', border: `1px dashed ${T.border}`,
                            color: T.muted, cursor: 'pointer',
                            fontFamily: "'IBM Plex Mono', monospace",
                            fontSize: 10, letterSpacing: '0.1em',
                            transition: 'all 0.12s',
                          }}
                          onMouseEnter={e => { e.currentTarget.style.borderColor = `${T.accent}50`; e.currentTarget.style.color = T.accent; }}
                          onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.muted; }}
                        >
                          <Plus size={12} />
                          Nuevo proyecto
                        </button>
                      ) : (
                        <div style={{ border: `1px solid ${T.accent}35`, padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
                          <p style={{ fontSize: 9, color: T.accent, letterSpacing: '0.14em', textTransform: 'uppercase', margin: 0, fontWeight: 700 }}>
                            Nuevo proyecto
                          </p>
                          <input
                            autoFocus
                            type="text"
                            placeholder="Nombre del proyecto"
                            value={wizard.newProjectName}
                            onChange={e => setWizard(w => ({ ...w, newProjectName: e.target.value }))}
                            onKeyDown={e => { if (e.key === 'Enter') void wizardCreateProject(); }}
                            style={{
                              width: '100%', padding: '8px 10px', fontSize: 11,
                              fontFamily: "'IBM Plex Mono', monospace",
                              background: T.card, border: `1px solid ${T.border}`,
                              color: T.text, outline: 'none', boxSizing: 'border-box',
                            }}
                          />
                          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                            <button
                              onClick={() => setWizard(w => ({ ...w, showNewProject: false, newProjectName: '' }))}
                              style={{ fontSize: 10, color: T.muted, background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'IBM Plex Mono', monospace" }}
                            >
                              Cancelar
                            </button>
                            <button
                              disabled={!wizard.newProjectName.trim() || wizard.submitting}
                              onClick={() => void wizardCreateProject()}
                              style={{
                                display: 'flex', alignItems: 'center', gap: 6,
                                padding: '7px 16px', fontSize: 9,
                                letterSpacing: '0.12em', textTransform: 'uppercase',
                                fontFamily: "'IBM Plex Mono', monospace", fontWeight: 700,
                                background: T.accent, color: '#FFF8F0',
                                border: 'none', cursor: wizard.newProjectName.trim() ? 'pointer' : 'not-allowed',
                                opacity: wizard.newProjectName.trim() ? 1 : 0.4,
                                transition: 'opacity 0.12s',
                              }}
                            >
                              {wizard.submitting ? <Loader2 size={11} className="animate-spin" /> : <Plus size={11} />}
                              Crear y seleccionar
                            </button>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div style={{ padding: '14px 30px', borderTop: `1px solid ${T.border}`, display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={closeModal}
                style={{ fontSize: 10, color: T.muted, background: 'none', border: 'none', cursor: 'pointer', letterSpacing: '0.1em', fontFamily: "'IBM Plex Mono', monospace", transition: 'color 0.12s' }}
                onMouseEnter={e => (e.currentTarget.style.color = T.text)}
                onMouseLeave={e => (e.currentTarget.style.color = T.muted)}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete confirm ──────────────────────────────────────────────── */}
      {pendingDelete && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(8, 6, 4, 0.88)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, backdropFilter: 'blur(6px)' }}
          onClick={() => !deleting && setPendingDelete(null)}
        >
          <div
            className="k-modal"
            style={{ background: T.surface, border: `1px solid ${T.border}`, maxWidth: 380, width: '100%', padding: 30 }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 26 }}>
              <div style={{ width: 34, height: 34, border: `1px solid ${T.accent}35`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Trash2 size={14} style={{ color: T.accent }} />
              </div>
              <div>
                <p style={{ fontSize: 13, fontWeight: 700, color: T.text, margin: '0 0 6px', letterSpacing: '0.03em' }}>
                  Eliminar documento
                </p>
                <p style={{ fontSize: 11, color: T.muted, lineHeight: 1.65, margin: 0 }}>
                  ¿Eliminar <span style={{ color: T.text, fontWeight: 700 }}>{pendingDelete.title}</span>?
                  {' '}Esta acción no se puede deshacer.
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 14 }}>
              <button
                disabled={deleting}
                onClick={() => setPendingDelete(null)}
                style={{ fontSize: 10, color: T.muted, background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'IBM Plex Mono', monospace", letterSpacing: '0.1em', transition: 'color 0.12s' }}
                onMouseEnter={e => (e.currentTarget.style.color = T.text)}
                onMouseLeave={e => (e.currentTarget.style.color = T.muted)}
              >
                Cancelar
              </button>
              <button
                disabled={deleting}
                onClick={confirmDelete}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  background: T.accent, color: '#FFF8F0',
                  border: 'none', cursor: deleting ? 'not-allowed' : 'pointer',
                  padding: '9px 20px',
                  fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase',
                  fontFamily: "'IBM Plex Mono', monospace", fontWeight: 700,
                  opacity: deleting ? 0.55 : 1,
                  transition: 'opacity 0.15s',
                }}
                onMouseEnter={e => { if (!deleting) e.currentTarget.style.opacity = '0.82'; }}
                onMouseLeave={e => { if (!deleting) e.currentTarget.style.opacity = '1'; }}
              >
                {deleting
                  ? <><Loader2 size={12} className="animate-spin" />Eliminando…</>
                  : <><Trash2 size={12} />Eliminar</>
                }
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
