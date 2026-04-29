import { useState, useEffect } from 'react';
import type { CliFields, KananProject } from '@kanan/shared';
import { DocHeader } from '../components/ui/DocHeader.tsx';
import { DocFooter } from '../components/ui/DocFooter.tsx';
import { EditableField } from '../components/ui/EditableField.tsx';
import { useDocument } from '../context/DocumentContext.tsx';
import { api } from '../api/client.ts';

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

function fmtMoney(n?: number) {
  if (n == null) return '';
  return new Intl.NumberFormat('es-DO', { style: 'currency', currency: 'DOP', maximumFractionDigits: 0 }).format(n);
}

export function ClienteDoc() {
  const { fields, dispatch, doc } = useDocument();
  const f = fields as CliFields;
  const set = (path: string, value: unknown) => dispatch({ type: 'SET_FIELD', path, value });

  const [projects, setProjects] = useState<KananProject[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(false);

  const clientId = doc?.projectId
    ? typeof doc.projectId === 'object' ? doc.projectId.clientId : null
    : null;

  useEffect(() => {
    if (!clientId) return;
    setLoadingProjects(true);
    api.clients.projects(clientId)
      .then((p) => setProjects(p as KananProject[]))
      .catch(() => {})
      .finally(() => setLoadingProjects(false));
  }, [clientId]);

  return (
    <div className="doc on">
      <p className="hint">Haz clic en cualquier campo para editar</p>

      <DocHeader docType="Ficha de Cliente" />

      {/* Datos principales */}
      <div className="sd">Datos del cliente</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 32px', marginBottom: 16 }}>
        <div>
          <div className="lb">Nombre</div>
          <div className="cn">
            <EditableField value={f.clientName} onChange={(v) => set('clientName', v)} size={28} />
          </div>
        </div>
        <div>
          <div className="lb">Tipo</div>
          <div style={{ marginTop: 4 }}>
            <select
              value={f.type ?? 'residencial'}
              onChange={(e) => set('type', e.target.value)}
              style={{ font: 'inherit', fontSize: 12, background: 'transparent', border: 'none', cursor: 'pointer', padding: '2px 0' }}
            >
              <option value="residencial">Residencial</option>
              <option value="comercial">Comercial</option>
              <option value="institucional">Institucional</option>
            </select>
          </div>
        </div>
        <div>
          <div className="lb">Cédula / RNC</div>
          <div className="cs" style={{ marginTop: 4, fontWeight: 500 }}>
            <EditableField value={f.cedula} onChange={(v) => set('cedula', v)} size={18} />
          </div>
        </div>
        <div>
          <div className="lb">Teléfono</div>
          <div className="cs" style={{ marginTop: 4, fontWeight: 500 }}>
            <EditableField value={f.phone} onChange={(v) => set('phone', v)} size={18} />
          </div>
        </div>
        <div style={{ gridColumn: '1 / -1' }}>
          <div className="lb">Email</div>
          <div className="cs" style={{ marginTop: 4, fontWeight: 500 }}>
            <EditableField value={f.email} onChange={(v) => set('email', v)} size={36} />
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
      </div>

      {/* Notas */}
      <div className="sd">Notas internas</div>
      <div style={{ marginBottom: 20, fontSize: 12, lineHeight: 1.6 }}>
        <EditableField
          value={f.notes}
          onChange={(v) => set('notes', v)}
          size={72}
          multiline
        />
      </div>

      {/* Proyectos vinculados */}
      <div className="sd">Proyectos asociados</div>
      {!clientId ? (
        <p style={{ fontSize: 11, color: 'var(--p)', fontStyle: 'italic', marginBottom: 16 }}>
          Guarda el documento para ver los proyectos vinculados.
        </p>
      ) : loadingProjects ? (
        <p style={{ fontSize: 11, color: 'var(--p)', marginBottom: 16 }}>Cargando…</p>
      ) : projects.length === 0 ? (
        <p style={{ fontSize: 11, color: 'var(--p)', fontStyle: 'italic', marginBottom: 16 }}>
          Sin proyectos registrados todavía.
        </p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11, marginBottom: 20 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--b)' }}>
              <th style={{ textAlign: 'left', padding: '4px 8px 4px 0', fontWeight: 600, color: 'var(--p)', letterSpacing: '0.08em' }}>Proyecto</th>
              <th style={{ textAlign: 'left', padding: '4px 8px', fontWeight: 600, color: 'var(--p)', letterSpacing: '0.08em' }}>Estado</th>
              <th style={{ textAlign: 'left', padding: '4px 8px', fontWeight: 600, color: 'var(--p)', letterSpacing: '0.08em' }}>Inicio</th>
              <th style={{ textAlign: 'right', padding: '4px 0 4px 8px', fontWeight: 600, color: 'var(--p)', letterSpacing: '0.08em' }}>Monto</th>
            </tr>
          </thead>
          <tbody>
            {projects.map((p) => (
              <tr key={p._id} style={{ borderBottom: '1px solid var(--b)' }}>
                <td style={{ padding: '6px 8px 6px 0', fontWeight: 500 }}>{p.name}</td>
                <td style={{ padding: '6px 8px' }}>{STATUS_LABEL[p.status] ?? p.status}</td>
                <td style={{ padding: '6px 8px', color: 'var(--p)' }}>{fmtDate(p.startDate)}</td>
                <td style={{ padding: '6px 0 6px 8px', textAlign: 'right' }}>{fmtMoney(p.totalAmount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <DocFooter />
    </div>
  );
}
