import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, FileText, Loader2, X, Search, Layers, LayoutGrid } from 'lucide-react';
import { api } from '../api/client.ts';
import { TEMPLATE_META, PHASES } from '../templates/registry.ts';
import { ThemeSwitcher } from '../components/nav/ThemeSwitcher.tsx';
import { AppNav } from '../components/nav/AppNav.tsx';
import { Button } from '../components/ui/button.tsx';
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from '../components/ui/card.tsx';
import { cn } from '../lib/utils.ts';
import { useToast } from '../context/ToastContext.tsx';
import type { KananDocument, TemplateId } from '@kanan/shared';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-DO', { day: '2-digit', month: 'short', year: 'numeric' });
}

/** Pull client/project info from stored fields */
function docMeta(doc: KananDocument) {
  const f = doc.fields as unknown as Record<string, string>;
  // Some templates use template-specific names (e.g. CS uses contracteeName)
  const clientName = f['clientName']?.trim() || f['contracteeName']?.trim() || '';
  const projectName = f['projectName']?.trim() || '';
  return { clientName, projectName };
}

type ViewMode = 'grid' | 'byProject';

interface PendingDelete {
  id: string;
  title: string;
}

export function DocumentListPage() {
  const [docs, setDocs] = useState<KananDocument[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [activeClient, setActiveClient] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<PendingDelete | null>(null);
  const [deleting, setDeleting] = useState(false);
  const navigate = useNavigate();
  const { addToast } = useToast();

  useEffect(() => {
    api.documents.list()
      .then((d) => setDocs(d as KananDocument[]))
      .catch(() => addToast('Error al cargar los documentos', 'error'))
      .finally(() => setLoading(false));
  }, []);

  const createDoc = async (templateId: TemplateId) => {
    const meta = TEMPLATE_META[templateId];
    const year = new Date().getFullYear();
    const sameType = docs.filter((d) => d.templateId === templateId).length;
    const docNumber = `${meta.prefix}-${year}-${String(sameType + 1).padStart(4, '0')}`;
    const fields = { ...meta.defaultFields(), docNumber };
    try {
      const doc = await api.documents.create({
        templateId,
        title: docNumber,
        theme: 'o',
        fields,
      }) as KananDocument;
      navigate(`/documents/${doc._id}`);
    } catch {
      addToast('Error al crear el documento', 'error');
    }
  };

  /** Step 1: show custom confirm dialog */
  const requestDelete = (doc: KananDocument, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setPendingDelete({ id: doc._id, title: doc.title });
  };

  /** Step 2: user confirmed — execute deletion */
  const confirmDelete = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await api.documents.delete(pendingDelete.id);
      setDocs((prev) => prev.filter((d) => d._id !== pendingDelete.id));
      addToast('Documento eliminado', 'success');
    } catch {
      addToast('Error al eliminar el documento', 'error');
    } finally {
      setDeleting(false);
      setPendingDelete(null);
    }
  };

  // ── Filtered list ────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return docs.filter((doc) => {
      const { clientName, projectName } = docMeta(doc);
      const matchesSearch =
        !q ||
        doc.title.toLowerCase().includes(q) ||
        clientName.toLowerCase().includes(q) ||
        projectName.toLowerCase().includes(q);
      const matchesClient = !activeClient || clientName === activeClient;
      return matchesSearch && matchesClient;
    });
  }, [docs, search, activeClient]);

  // ── Unique clients sidebar ────────────────────────────────────────────────
  const uniqueClients = useMemo(() => {
    const names = new Set<string>();
    docs.forEach((d) => {
      const { clientName } = docMeta(d);
      if (clientName) names.add(clientName);
    });
    return Array.from(names).sort();
  }, [docs]);

  // ── Group by client › project ─────────────────────────────────────────────
  const grouped = useMemo(() => {
    const map = new Map<string, { clientName: string; projectName: string; docs: KananDocument[] }>();
    for (const doc of filtered) {
      const { clientName, projectName } = docMeta(doc);
      const key = `${clientName}||${projectName}`;
      if (!map.has(key)) map.set(key, { clientName, projectName, docs: [] });
      map.get(key)!.docs.push(doc);
    }
    // Sort: groups with client name first, then by project name
    return Array.from(map.values()).sort((a, b) => {
      if (a.clientName && !b.clientName) return -1;
      if (!a.clientName && b.clientName) return 1;
      return (a.clientName + a.projectName).localeCompare(b.clientName + b.projectName);
    });
  }, [filtered]);

  // ── Document card ─────────────────────────────────────────────────────────
  const DocCard = ({ doc }: { doc: KananDocument }) => {
    const meta = TEMPLATE_META[doc.templateId];
    const { clientName, projectName } = docMeta(doc);
    return (
      <Card
        className="cursor-pointer hover:border-olivo/40 transition-colors group"
        onClick={() => navigate(`/documents/${doc._id}`)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && navigate(`/documents/${doc._id}`)}
      >
        <CardHeader className="pb-1.5">
          <p className="text-[10px] tracking-[0.15em] text-olivo uppercase mb-1">
            {meta?.docType ?? doc.templateId}
          </p>
          <CardTitle className="text-[13px] leading-snug">{doc.title}</CardTitle>
          {(clientName || projectName) && (
            <div className="mt-1 space-y-0.5">
              {clientName && (
                <p className="text-[10px] text-carbon/80 font-medium truncate">{clientName}</p>
              )}
              {projectName && (
                <p className="text-[10px] text-piedra truncate">{projectName}</p>
              )}
            </div>
          )}
        </CardHeader>
        <CardFooter className="justify-between pt-0">
          <CardDescription className="text-[10px]">{formatDate(doc.updatedAt)}</CardDescription>
          <button
            className="opacity-0 group-hover:opacity-100 transition-opacity text-piedra hover:text-terracota p-1"
            onClick={(e) => requestDelete(doc, e)}
            title="Eliminar"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </CardFooter>
      </Card>
    );
  };

  const hasContent = !loading && docs.length > 0;

  return (
    <>
      <AppNav />
      <ThemeSwitcher />

      <div className="max-w-6xl mx-auto px-4 py-8 pb-16">
        {/* ── Header ───────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="font-sans font-black text-xl tracking-[0.12em] text-carbon uppercase">
            Documentos
          </h1>
          <Button variant="kanan" size="sm" onClick={() => setShowModal(true)}>
            <Plus className="w-3.5 h-3.5" />
            Nuevo documento
          </Button>
        </div>

        {/* ── Controls bar ─────────────────────────────────────────────── */}
        {hasContent && (
          <div className="flex items-center gap-3 mb-5">
            {/* Search */}
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-piedra pointer-events-none" />
              <input
                type="text"
                placeholder="Buscar por título, cliente o proyecto…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-[11px] font-mono bg-transparent border border-border focus:border-olivo/50 outline-none transition-colors placeholder:text-piedra/60"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-piedra hover:text-carbon"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* View toggle */}
            <div className="flex items-center border border-border">
              <button
                onClick={() => setViewMode('grid')}
                title="Vista grilla"
                className={cn(
                  'p-1.5 transition-colors',
                  viewMode === 'grid' ? 'bg-carbon text-crema' : 'text-piedra hover:text-carbon'
                )}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewMode('byProject')}
                title="Agrupar por proyecto"
                className={cn(
                  'p-1.5 transition-colors',
                  viewMode === 'byProject' ? 'bg-carbon text-crema' : 'text-piedra hover:text-carbon'
                )}
              >
                <Layers className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* ── Loading ───────────────────────────────────────────────────── */}
        {loading && (
          <div className="flex items-center gap-2 text-piedra text-sm py-12 justify-center">
            <Loader2 className="w-4 h-4 animate-spin" />
            Cargando…
          </div>
        )}

        {/* ── Empty state ───────────────────────────────────────────────── */}
        {!loading && docs.length === 0 && (
          <div className="text-center py-16 text-piedra">
            <FileText className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p className="text-sm mb-4 tracking-wide">No hay documentos todavía.</p>
            <Button variant="kanan" size="sm" onClick={() => setShowModal(true)}>
              Crear el primero
            </Button>
          </div>
        )}

        {/* ── No results ───────────────────────────────────────────────── */}
        {hasContent && filtered.length === 0 && (
          <p className="text-[11px] text-piedra font-mono py-8 text-center">
            Sin resultados para "{search || activeClient}"
          </p>
        )}

        {/* ── Content ──────────────────────────────────────────────────── */}
        {hasContent && filtered.length > 0 && (
          <div className="flex gap-6">
            {/* Sidebar: unique clients */}
            {uniqueClients.length > 0 && (
              <aside className="w-44 flex-shrink-0">
                <p className="text-[9px] tracking-[0.18em] text-piedra uppercase mb-2 font-mono">Clientes</p>
                <ul className="space-y-px">
                  <li>
                    <button
                      onClick={() => setActiveClient(null)}
                      className={cn(
                        'w-full text-left text-[11px] font-mono px-2 py-1 transition-colors truncate',
                        activeClient === null
                          ? 'text-carbon font-bold bg-olivo/10'
                          : 'text-piedra hover:text-carbon'
                      )}
                    >
                      Todos
                    </button>
                  </li>
                  {uniqueClients.map((name) => (
                    <li key={name}>
                      <button
                        onClick={() => setActiveClient(activeClient === name ? null : name)}
                        className={cn(
                          'w-full text-left text-[11px] font-mono px-2 py-1 transition-colors truncate',
                          activeClient === name
                            ? 'text-carbon font-bold bg-olivo/10'
                            : 'text-piedra hover:text-carbon'
                        )}
                      >
                        {name}
                      </button>
                    </li>
                  ))}
                </ul>
              </aside>
            )}

            {/* Main content */}
            <div className="flex-1 min-w-0">
              {viewMode === 'grid' ? (
                /* ── Flat grid ── */
                <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-3">
                  {filtered.map((doc) => <DocCard key={doc._id} doc={doc} />)}
                </div>
              ) : (
                /* ── Grouped by project ── */
                <div className="space-y-8">
                  {grouped.map(({ clientName, projectName, docs: groupDocs }) => {
                    const groupLabel =
                      clientName && projectName
                        ? `${clientName} · ${projectName}`
                        : clientName || projectName || 'Sin proyecto asignado';
                    return (
                      <div key={`${clientName}||${projectName}`}>
                        <div className="flex items-center gap-3 mb-3">
                          <span className="text-[10px] tracking-[0.14em] font-mono font-bold text-carbon uppercase">
                            {groupLabel}
                          </span>
                          <span className="text-[10px] text-piedra font-mono">
                            {groupDocs.length} doc{groupDocs.length !== 1 ? 's' : ''}
                          </span>
                          <div className="flex-1 border-t border-border" />
                        </div>
                        <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-3">
                          {groupDocs.map((doc) => <DocCard key={doc._id} doc={doc} />)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── New document modal ────────────────────────────────────────────── */}
      {showModal && (
        <div
          className="fixed inset-0 bg-carbon/60 z-50 flex items-center justify-center p-4"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-crema max-w-2xl w-full max-h-[88vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-7 pt-6 pb-4 border-b border-border flex-shrink-0">
              <div>
                <h2 className="text-[13px] font-bold tracking-[0.12em] uppercase text-carbon">
                  Nuevo documento
                </h2>
                <p className="text-[10px] text-piedra font-mono mt-0.5">
                  Selecciona el tipo según la fase del proyecto
                </p>
              </div>
              <button
                className="text-piedra hover:text-carbon transition-colors"
                onClick={() => setShowModal(false)}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Phases */}
            <div className="overflow-y-auto px-7 py-5 space-y-6">
              {PHASES.map((phase) => {
                const phaseDocs = Object.values(TEMPLATE_META).filter(
                  (m) => m.phase === phase.id
                );
                return (
                  <div key={phase.id}>
                    {/* Phase header */}
                    <div className="flex items-baseline gap-3 mb-2">
                      <span className="text-[10px] font-mono font-bold tracking-[0.16em] uppercase text-carbon">
                        {phase.label}
                      </span>
                      <span className="text-[10px] text-piedra font-mono">
                        {phase.description}
                      </span>
                      <div className="flex-1 border-t border-border self-center" />
                    </div>
                    {/* Doc buttons */}
                    <div className="flex flex-wrap gap-2">
                      {phaseDocs.map((m) => (
                        <button
                          key={m.id}
                          className={cn(
                            'flex items-center gap-2 border border-border px-3 py-2 transition-colors font-mono',
                            'hover:border-olivo hover:bg-olivo/5 text-left'
                          )}
                          onClick={() => { setShowModal(false); void createDoc(m.id); }}
                        >
                          <span className="text-[9px] text-olivo tracking-[0.12em] uppercase font-bold w-8 flex-shrink-0">
                            {m.label}
                          </span>
                          <span className="text-[11px] text-carbon">
                            {m.docType}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer */}
            <div className="px-7 py-4 border-t border-border flex-shrink-0">
              <button
                className="text-[11px] text-piedra hover:text-carbon tracking-[0.08em] transition-colors font-mono"
                onClick={() => setShowModal(false)}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete confirm dialog ─────────────────────────────────────────── */}
      {pendingDelete && (
        <div
          className="fixed inset-0 bg-carbon/60 z-50 flex items-center justify-center p-4"
          onClick={() => !deleting && setPendingDelete(null)}
        >
          <div
            className="bg-crema max-w-sm w-full p-7"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3 mb-5">
              <Trash2 className="w-4 h-4 text-terracota flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-[13px] font-bold tracking-[0.08em] text-carbon mb-1">
                  Eliminar documento
                </p>
                <p className="text-[11px] text-piedra font-mono leading-relaxed">
                  ¿Eliminar <span className="text-carbon font-bold">{pendingDelete.title}</span>?
                  Esta acción no se puede deshacer.
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3">
              <button
                disabled={deleting}
                onClick={() => setPendingDelete(null)}
                className="text-[11px] font-mono text-piedra hover:text-carbon transition-colors disabled:opacity-40"
              >
                Cancelar
              </button>
              <button
                disabled={deleting}
                onClick={confirmDelete}
                className="flex items-center gap-1.5 bg-terracota text-crema text-[11px] font-mono tracking-widest px-4 py-2 hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {deleting
                  ? <><Loader2 className="w-3 h-3 animate-spin" /> Eliminando…</>
                  : <><Trash2 className="w-3 h-3" /> Eliminar</>
                }
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
