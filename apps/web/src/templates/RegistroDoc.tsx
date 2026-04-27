import type { RegFields, BadgeStatus, RegRow } from '@kanan/shared';
import { DocHeader } from '../components/ui/DocHeader.tsx';
import { DocFooter } from '../components/ui/DocFooter.tsx';
import { EditableField } from '../components/ui/EditableField.tsx';
import { Badge } from '../components/ui/Badge.tsx';
import { useDocument } from '../context/DocumentContext.tsx';

const STATUS_OPTIONS: BadgeStatus[] = ['cotizando', 'activo', 'completado'];

function fmt(n: number) {
  return n.toLocaleString('es-DO', { minimumFractionDigits: 2 });
}

export function RegistroDoc() {
  const { fields, dispatch } = useDocument();
  const f = fields as RegFields;
  const set = (path: string, value: unknown) => dispatch({ type: 'SET_FIELD', path, value });

  const updateRow = (i: number, key: keyof RegRow, value: unknown) => {
    const rows = f.rows.map((r, j) => j === i ? { ...r, [key]: value } : r);
    set('rows', rows);
  };

  const emptyRow = (): RegRow => ({ ref: '', client: '', project: '', status: 'activo', startDate: '', endDate: '', amount: 0 });

  return (
    <div className="doc on">
      <p className="hint">Haz clic en cualquier campo para editar</p>
      <DocHeader docType="Registro de Proyectos" extraDateLabel="Actualizado:" extraDateField="updatedDate" />

      <div className="sd">Proyectos activos</div>
      <table>
        <thead>
          <tr>
            <th>Ref.</th>
            <th>Cliente</th>
            <th>Proyecto</th>
            <th>Estado</th>
            <th>Inicio</th>
            <th>Fin</th>
            <th className="r">Monto RD$</th>
            <th style={{ width: 24 }} />
          </tr>
        </thead>
        <tbody>
          {f.rows.map((row, i) => (
            <tr key={i}>
              <td className="sm"><EditableField value={row.ref} onChange={(v) => updateRow(i, 'ref', v)} size={14} /></td>
              <td><EditableField value={row.client} onChange={(v) => updateRow(i, 'client', v)} size={16} /></td>
              <td><EditableField value={row.project} onChange={(v) => updateRow(i, 'project', v)} size={24} /></td>
              <td>
                <select
                  value={row.status}
                  onChange={(e) => updateRow(i, 'status', e.target.value)}
                  style={{ font: 'inherit', fontSize: 11, background: 'transparent', border: 'none', cursor: 'pointer' }}
                >
                  {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </td>
              <td className="sm"><EditableField value={row.startDate} onChange={(v) => updateRow(i, 'startDate', v)} size={6} /></td>
              <td className="sm"><EditableField value={row.endDate} onChange={(v) => updateRow(i, 'endDate', v)} size={6} /></td>
              <td className="r">
                <EditableField value={String(row.amount)} onChange={(v) => updateRow(i, 'amount', parseFloat(v) || 0)} numeric size={8} />
              </td>
              <td>
                <span className="row-actions">
                  <button className="row-del" onClick={() => set('rows', f.rows.filter((_, j) => j !== i))}>×</button>
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <button className="add-row-btn" onClick={() => set('rows', [...f.rows, emptyRow()])}>+ AÑADIR PROYECTO</button>

      {(() => {
        const active = f.rows.filter(r => r.status === 'activo').length;
        const quoting = f.rows.filter(r => r.status === 'cotizando').length;
        const activeTotal = f.rows.filter(r => r.status === 'activo').reduce((s, r) => s + r.amount, 0);
        return (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginTop: 20 }}>
            <div>
              <div className="lb">Proyectos activos</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--o)', marginTop: 4 }}>{active}</div>
            </div>
            <div>
              <div className="lb">En cotización</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--t)', marginTop: 4 }}>{quoting}</div>
            </div>
            <div>
              <div className="lb">Monto activo total</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--c)', marginTop: 4 }}>RD$ {fmt(activeTotal)}</div>
            </div>
          </div>
        );
      })()}

      <DocFooter />
    </div>
  );
}
