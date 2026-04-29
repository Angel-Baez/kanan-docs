import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { MapPin, DollarSign, Plus, X, Loader2 } from 'lucide-react';
import { api } from '../api/client.ts';
import { useToast } from '../context/ToastContext.tsx';
import type { KananProject, KananClient } from '@kanan/shared';

const T = {
  bg:      '#0F0D0B',
  surface: '#161310',
  card:    '#1E1B17',
  cardHov: '#252118',
  border:  '#2A2520',
  text:    '#E8DFCF',
  muted:   '#7A7068',
  dim:     '#4A4540',
  accent:  '#B95D34',
} as const;

type Status = 'cotizando' | 'activo' | 'completado' | 'garantia';

const COLUMNS: { id: Status; label: string; text: string; bg: string; border: string }[] = [
  { id: 'cotizando',  label: 'Cotizando',  text: '#C9AA71', bg: '#C9AA7108', border: '#C9AA7125' },
  { id: 'activo',     label: 'Activo',     text: '#7A8C47', bg: '#7A8C4708', border: '#7A8C4725' },
  { id: 'completado', label: 'Completado', text: '#9CAA72', bg: '#9CAA7208', border: '#9CAA7225' },
  { id: 'garantia',   label: 'Garantía',   text: '#C4673A', bg: '#C4673A08', border: '#C4673A25' },
];

function fmt(n?: number) {
  if (n == null) return null;
  return new Intl.NumberFormat('es-DO', { style: 'currency', currency: 'DOP', maximumFractionDigits: 0 }).format(n);
}

// ── Project card (draggable) ──────────────────────────────────────────────────
interface CardProps { project: KananProject; clientName?: string | undefined; isDragging?: boolean | undefined }

function ProjectCard({ project, clientName, isDragging }: CardProps) {
  return (
    <Link
      to={`/projects/${project._id}`}
      onClick={e => { if (isDragging) e.preventDefault(); }}
      style={{
        display: 'block',
        background: isDragging ? '#2A2520' : T.card,
        border: `1px solid ${T.border}`,
        padding: '12px 14px',
        textDecoration: 'none',
        cursor: isDragging ? 'grabbing' : 'grab',
        boxShadow: isDragging ? '0 8px 24px rgba(0,0,0,0.5)' : 'none',
        transition: 'background 0.12s, box-shadow 0.12s',
        opacity: isDragging ? 0.95 : 1,
      }}
      onMouseEnter={e => { if (!isDragging) e.currentTarget.style.background = T.cardHov; }}
      onMouseLeave={e => { if (!isDragging) e.currentTarget.style.background = T.card; }}
    >
      <div style={{ fontSize: 11, color: T.text, lineHeight: 1.4, marginBottom: clientName ? 4 : 0, fontFamily: "'IBM Plex Mono', monospace" }}>
        {project.name}
      </div>
      {clientName && (
        <div style={{ fontSize: 9, color: T.muted, fontFamily: "'IBM Plex Mono', monospace" }}>{clientName}</div>
      )}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
        {project.address1 && (
          <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 9, color: T.dim, fontFamily: "'IBM Plex Mono', monospace" }}>
            <MapPin size={9} />
            {project.address1}
          </span>
        )}
        {project.totalAmount != null && (
          <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 9, color: T.dim, fontFamily: "'IBM Plex Mono', monospace" }}>
            <DollarSign size={9} />
            {fmt(project.totalAmount)}
          </span>
        )}
      </div>
    </Link>
  );
}

// ── Droppable column area ─────────────────────────────────────────────────────
function DroppableColumn({ id, children }: { id: string; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div
      ref={setNodeRef}
      style={{
        minHeight: 60,
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        borderRadius: 2,
        transition: 'background 0.15s',
        background: isOver ? 'rgba(185,93,52,0.05)' : 'transparent',
        padding: isOver ? '4px' : '0px',
      }}
    >
      {children}
    </div>
  );
}

// ── Sortable card wrapper ─────────────────────────────────────────────────────
function SortableCard({ project, clientName }: { project: KananProject; clientName?: string | undefined }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: project._id as string,
  });
  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.3 : 1 }}
    >
      <ProjectCard project={project} clientName={clientName} />
    </div>
  );
}

// ── New project modal ─────────────────────────────────────────────────────────
interface NewProjectModalProps {
  clients: KananClient[];
  defaultStatus: Status;
  onClose: () => void;
  onCreated: (p: KananProject) => void;
}

function NewProjectModal({ clients, defaultStatus, onClose, onCreated }: NewProjectModalProps) {
  const [name, setName] = useState('');
  const [clientId, setClientId] = useState(clients[0]?._id as string ?? '');
  const [saving, setSaving] = useState(false);
  const { addToast } = useToast();

  const handleCreate = async () => {
    if (!name.trim() || !clientId) return;
    setSaving(true);
    try {
      const proj = await api.projects.create({ name: name.trim(), clientId, status: defaultStatus }) as KananProject;
      onCreated(proj);
      addToast('Proyecto creado', 'success');
    } catch {
      addToast('Error al crear proyecto', 'error');
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
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 400, background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: '#1A1714', border: `1px solid ${T.border}`, width: '100%', maxWidth: 400, fontFamily: "'IBM Plex Mono', monospace" }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 24px', borderBottom: `1px solid ${T.border}` }}>
          <span style={{ fontSize: 9, letterSpacing: '0.22em', textTransform: 'uppercase', color: T.muted }}>Nuevo proyecto</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.muted, display: 'flex', padding: 0 }}><X size={15} /></button>
        </div>
        <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontSize: 8, letterSpacing: '0.18em', textTransform: 'uppercase', color: T.muted }}>Nombre *</span>
            <input value={name} onChange={e => setName(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') handleCreate(); }} style={inputStyle} autoFocus />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontSize: 8, letterSpacing: '0.18em', textTransform: 'uppercase', color: T.muted }}>Cliente</span>
            <select value={clientId} onChange={e => setClientId(e.target.value)} style={{ ...inputStyle, appearance: 'none' }}>
              {clients.map(c => <option key={c._id as string} value={c._id as string}>{c.name}</option>)}
            </select>
          </label>
        </div>
        <div style={{ padding: '0 24px 24px', display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', padding: '9px 20px', background: 'none', border: `1px solid ${T.border}`, color: T.muted, cursor: 'pointer', fontFamily: "'IBM Plex Mono', monospace" }}>Cancelar</button>
          <button onClick={handleCreate} disabled={saving || !name.trim()} style={{ fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', padding: '9px 20px', background: saving ? T.border : T.accent, border: 'none', color: '#fff', cursor: saving ? 'default' : 'pointer', fontFamily: "'IBM Plex Mono', monospace", display: 'flex', alignItems: 'center', gap: 7 }}>
            {saving && <Loader2 size={11} style={{ animation: 'spin 1s linear infinite' }} />}
            Crear
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
const STYLES = `
@keyframes kFadeUp { from { opacity:0;transform:translateY(6px); } to { opacity:1;transform:translateY(0); } }
.k-in { animation: kFadeUp 0.28s ease both; }
@keyframes spin { to { transform: rotate(360deg); } }
`;

export function ProjectPipelinePage() {
  const [projects, setProjects] = useState<KananProject[]>([]);
  const [clients, setClients] = useState<KananClient[]>([]);
  const [clientMap, setClientMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [newInCol, setNewInCol] = useState<Status | null>(null);
  const { addToast } = useToast();

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  useEffect(() => {
    Promise.all([api.projects.list(), api.clients.list()])
      .then(([projs, cls]) => {
        setProjects(projs as KananProject[]);
        const cList = cls as KananClient[];
        setClients(cList);
        setClientMap(Object.fromEntries(cList.map(c => [String(c._id), c.name])));
      })
      .catch(() => addToast('Error cargando proyectos', 'error'))
      .finally(() => setLoading(false));
  }, []);

  const byStatus = useCallback((status: Status) =>
    projects.filter(p => p.status === status), [projects]);

  const activeProject = activeId ? projects.find(p => String(p._id) === activeId) : null;

  const handleDragStart = (e: DragStartEvent) => setActiveId(String(e.active.id));

  const handleDragEnd = async (e: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = e;
    if (!over) return;

    const draggedId = String(active.id);
    const overId = String(over.id);

    // Priority order for target column detection:
    // 1. over.id is a column id (dropped on the DroppableColumn area, esp. empty columns)
    // 2. over.data.current?.sortable?.containerId is the SortableContext id (dropped on a card)
    const containerId = over.data.current?.sortable?.containerId as string | undefined;
    const targetStatus: Status | undefined =
      COLUMNS.find(c => c.id === overId)?.id
      ?? COLUMNS.find(c => c.id === containerId)?.id;

    if (!targetStatus) return;
    const dragged = projects.find(p => String(p._id) === draggedId);
    if (!dragged || dragged.status === targetStatus) return;

    // Optimistic update
    setProjects(prev => prev.map(p => String(p._id) === draggedId ? { ...p, status: targetStatus } : p));

    try {
      await api.projects.update(draggedId, { status: targetStatus });
    } catch {
      // Revert on failure
      setProjects(prev => prev.map(p => String(p._id) === draggedId ? { ...p, status: dragged.status } : p));
      addToast('Error al actualizar estado', 'error');
    }
  };

  return (
    <>
      <style>{STYLES}</style>
      <div style={{ padding: '52px 32px 80px', color: T.text, fontFamily: "'IBM Plex Mono', monospace" }}>

        {/* Header */}
        <div className="k-in" style={{ marginBottom: 36, animationDelay: '0ms' }}>
          <p style={{ fontSize: 8, letterSpacing: '0.26em', textTransform: 'uppercase', color: T.dim, margin: '0 0 10px' }}>Pipeline</p>
          <h1 style={{ fontFamily: 'Fraunces, serif', fontStyle: 'italic', fontSize: 'clamp(36px, 4vw, 52px)', fontWeight: 400, color: T.text, lineHeight: 1.0, margin: 0 }}>
            Proyectos
          </h1>
        </div>

        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16 }}>
            {[...Array(4)].map((_, i) => (
              <div key={i} style={{ height: 240, background: T.surface, border: `1px solid ${T.border}`, opacity: 0.4 }} />
            ))}
          </div>
        ) : (
          <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, alignItems: 'start' }}>
              {COLUMNS.map((col, colIdx) => {
                const colProjects = byStatus(col.id);
                return (
                  <div key={col.id} className="k-in" style={{ animationDelay: `${colIdx * 40}ms` }}>
                    {/* Column header */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, paddingBottom: 10, borderBottom: `1px solid ${col.border}` }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: col.text, flexShrink: 0 }} />
                        <span style={{ fontSize: 8, letterSpacing: '0.18em', textTransform: 'uppercase', color: col.text, fontWeight: 700 }}>
                          {col.label}
                        </span>
                        <span style={{ fontSize: 9, color: T.dim }}>{colProjects.length}</span>
                      </div>
                      <button
                        onClick={() => setNewInCol(col.id)}
                        title={`Nuevo proyecto en ${col.label}`}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.dim, display: 'flex', padding: 2, transition: 'color 0.12s' }}
                        onMouseEnter={e => (e.currentTarget.style.color = T.text)}
                        onMouseLeave={e => (e.currentTarget.style.color = T.dim)}
                      >
                        <Plus size={12} />
                      </button>
                    </div>

                    {/* Drop zone + cards */}
                    <SortableContext items={colProjects.map(p => String(p._id))} strategy={verticalListSortingStrategy} id={col.id}>
                      <DroppableColumn id={col.id}>
                        {colProjects.length === 0 && (
                          <div style={{ padding: '16px 12px', fontSize: 9, color: T.dim, textAlign: 'center', border: `1px dashed ${T.border}` }}>
                            Arrastra aquí
                          </div>
                        )}
                        {colProjects.map(p => (
                          <SortableCard
                            key={String(p._id)}
                            project={p}
                            clientName={clientMap[String(p.clientId)]}
                          />
                        ))}
                      </DroppableColumn>
                    </SortableContext>
                  </div>
                );
              })}
            </div>

            {/* Dragging overlay */}
            <DragOverlay>
              {activeProject && (
                <ProjectCard
                  project={activeProject}
                  clientName={clientMap[String(activeProject.clientId)]}
                  isDragging
                />
              )}
            </DragOverlay>
          </DndContext>
        )}
      </div>

      {/* New project modal */}
      {newInCol && (
        <NewProjectModal
          clients={clients}
          defaultStatus={newInCol}
          onClose={() => setNewInCol(null)}
          onCreated={proj => {
            setProjects(prev => [...prev, proj]);
            setNewInCol(null);
          }}
        />
      )}
    </>
  );
}
