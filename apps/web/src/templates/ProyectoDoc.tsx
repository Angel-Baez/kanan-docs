import { useState, useEffect } from 'react';
import type { PryFields, KananDocument, KananProject } from '@kanan/shared';
import { DocHeader } from '../components/ui/DocHeader.tsx';
import { DocFooter } from '../components/ui/DocFooter.tsx';
import { EditableField } from '../components/ui/EditableField.tsx';
import { useDocument } from '../context/DocumentContext.tsx';
import { api } from '../api/client.ts';
import { TEMPLATE_META } from './registry.ts';

const STATUS_OPTS = ['cotizando', 'activo', 'completado', 'garantia'] as const;
const STATUS_LABEL: Record<string, string> = {
  cotizando: 'Cotizando',
  activo: 'Activo',
  completado: 'Completado',
  garantia: 'Garantía',
};

function fmtDate(iso?: string) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('es-DO', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function ProyectoDoc() {
  const { fields, dispatch, doc } = useDocument();
  const f = fields as PryFields;
  const set = (path: string, value: unknown) => dispatch({ type: 'SET_FIELD', path, value });

  const [docs, setDocs] = useState<KananDocument[]>([]);
  const [historial, setHistorial] = useState<KananProject['historial']>([]);
  const [loadingDocs, setLoadingDocs] = useState(false);

  const projectId = doc?.projectId
    ? typeof doc.projectId === 'object' ? doc.projectId._id : doc.projectId
    : null;

  useEffect(() => {
    if (!projectId) return;
    setLoadingDocs(true);
    Promise.all([
      api.projects.documents(projectId),
      api.projects.get(projectId),
    ])
      .then(([d, p]) => {
        setDocs(d as KananDocument[]);
        setHistorial((p as KananProject).historial ?? []);
      })
      .catch(() => {})
      .finally(() => setLoadingDocs(false));
  }, [projectId]);

  return (
    <div className="doc on">
      <p className="hint">Haz clic en cualquier campo para editar</p>

      <DocHeader docType="Ficha de Proyecto" />

      {/* Datos principales */}
      <div className="sd">Datos del proyecto</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 32px', marginBottom: 16 }}>
        <div style={{ gridColumn: '1 / -1' }}>
          <div className="lb">Nombre del proyecto</div>
          <div className="cn">
            <EditableField value={f.projectName} onChange={(v) => set('projectName', v)} size={36} />
          </div>
        </div>
        <div>
          <div className="lb">Cliente</div>
          <div className="cs" style={{ marginTop: 4, fontWeight: 500 }}>
            <EditableField value={f.clientName} onChange={(v) => set('clientName', v)} size={28} />
          </div>
        </div>
        <div>
          <div className="lb">Estado</div>
          <div style={{ marginTop: 4 }}>
            <select
              value={f.status ?? 'cotizando'}
              onChange={(e) => set('status', e.target.value)}
              style={{ font: 'inherit', fontSize: 12, background: 'transparent', border: 'none', cursor: 'pointer', padding: '2px 0' }}
            >
              {STATUS_OPTS.map((s) => (
                <option key={s} value={s}>{STATUS_LABEL[s]}</option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <div className="lb">Dirección línea 1</div>
          <div className="cs" style={{ marginTop: 4 }}>
            <EditableField value={f.address1} onChange={(v) => set('address1', v)} size={32} />
          </div>
        </div>
        <div>
          <div className="lb">Dirección línea 2</div>
          <div className="cs" style={{ marginTop: 4 }}>
            <EditableField value={f.address2} onChange={(v) => set('address2', v)} size={32} />
          </div>
        </div>
        <div>
          <div className="lb">Fecha inicio</div>
          <div className="cs" style={{ marginTop: 4, fontWeight: 500 }}>
            <EditableField value={f.startDate} onChange={(v) => set('startDate', v)} size={18} />
          </div>
        </div>
        <div>
          <div className="lb">Fecha fin estimada</div>
          <div className="cs" style={{ marginTop: 4, fontWeight: 500 }}>
            <EditableField value={f.endDate} onChange={(v) => set('endDate', v)} size={18} />
          </div>
        </div>
        <div>
          <div className="lb">Monto total contratado</div>
          <div className="cs" style={{ marginTop: 4, fontWeight: 600, fontSize: 13 }}>
            RD$ <EditableField value={f.totalAmount} onChange={(v) => set('totalAmount', v)} size={14} numeric />
          </div>
        </div>
      </div>

      {/* Notas */}
      <div className="sd">Notas internas</div>
      <div style={{ marginBottom: 20, fontSize: 12, lineHeight: 1.6 }}>
        <EditableField value={f.notes} onChange={(v) => set('notes', v)} size={72} multiline />
      </div>

      {/* Documentos vinculados */}
      <div className="sd">Documentos del proyecto</div>
      {!projectId ? (
        <p style={{ fontSize: 11, color: 'var(--p)', fontStyle: 'italic', marginBottom: 16 }}>
          Guarda el documento para ver los documentos vinculados.
        </p>
      ) : loadingDocs ? (
        <p style={{ fontSize: 11, color: 'var(--p)', marginBottom: 16 }}>Cargando…</p>
      ) : docs.length === 0 ? (
        <p style={{ fontSize: 11, color: 'var(--p)', fontStyle: 'italic', marginBottom: 16 }}>
          Sin documentos registrados todavía.
        </p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11, marginBottom: 20 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--b)' }}>
              <th style={{ textAlign: 'left', padding: '4px 8px 4px 0', fontWeight: 600, color: 'var(--p)', letterSpacing: '0.08em' }}>Tipo</th>
              <th style={{ textAlign: 'left', padding: '4px 8px', fontWeight: 600, color: 'var(--p)', letterSpacing: '0.08em' }}>Título</th>
              <th style={{ textAlign: 'left', padding: '4px 0 4px 8px', fontWeight: 600, color: 'var(--p)', letterSpacing: '0.08em' }}>Fecha</th>
            </tr>
          </thead>
          <tbody>
            {docs.map((d) => {
              const meta = TEMPLATE_META[d.templateId as keyof typeof TEMPLATE_META];
              return (
                <tr key={d._id} style={{ borderBottom: '1px solid var(--b)' }}>
                  <td style={{ padding: '6px 8px 6px 0', fontWeight: 600, letterSpacing: '0.06em', fontSize: 10 }}>
                    {meta?.label ?? d.templateId.toUpperCase()}
                  </td>
                  <td style={{ padding: '6px 8px', fontWeight: 500 }}>{d.title}</td>
                  <td style={{ padding: '6px 0 6px 8px', color: 'var(--p)' }}>{fmtDate(d.createdAt)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      {/* Historial de estado */}
      {historial.length > 0 && (
        <>
          <div className="sd">Historial de estado</div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11, marginBottom: 20 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--b)' }}>
                <th style={{ textAlign: 'left', padding: '4px 8px 4px 0', fontWeight: 600, color: 'var(--p)', letterSpacing: '0.08em' }}>Fecha</th>
                <th style={{ textAlign: 'left', padding: '4px 8px', fontWeight: 600, color: 'var(--p)', letterSpacing: '0.08em' }}>Campo</th>
                <th style={{ textAlign: 'left', padding: '4px 8px', fontWeight: 600, color: 'var(--p)', letterSpacing: '0.08em' }}>Anterior</th>
                <th style={{ textAlign: 'left', padding: '4px 0 4px 8px', fontWeight: 600, color: 'var(--p)', letterSpacing: '0.08em' }}>Nuevo</th>
              </tr>
            </thead>
            <tbody>
              {[...historial].reverse().map((entry, i) => (
                <tr key={i} style={{ borderBottom: '1px solid var(--b)' }}>
                  <td style={{ padding: '6px 8px 6px 0', color: 'var(--p)' }}>{fmtDate(entry.fecha)}</td>
                  <td style={{ padding: '6px 8px', textTransform: 'capitalize' }}>{entry.campo}</td>
                  <td style={{ padding: '6px 8px', color: 'var(--p)', textDecoration: 'line-through' }}>
                    {STATUS_LABEL[entry.valorAnterior] ?? entry.valorAnterior}
                  </td>
                  <td style={{ padding: '6px 0 6px 8px', fontWeight: 600 }}>
                    {STATUS_LABEL[entry.valorNuevo] ?? entry.valorNuevo}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      <DocFooter />
    </div>
  );
}
