import type { PlFields, PunchItem, BadgeStatus } from '@kanan/shared';
import { DocHeader } from '../components/ui/DocHeader.tsx';
import { DocFooter } from '../components/ui/DocFooter.tsx';
import { EditableField } from '../components/ui/EditableField.tsx';
import { SignatureBlock } from '../components/ui/SignatureBlock.tsx';
import { useDocument } from '../context/DocumentContext.tsx';

const STATUS_OPTIONS: BadgeStatus[] = ['pendiente', 'en-curso', 'hecho'];

export function PunchListDoc() {
  const { fields, dispatch } = useDocument();
  const f = fields as PlFields;
  const set = (path: string, value: unknown) => dispatch({ type: 'SET_FIELD', path, value });

  const updateItem = (i: number, key: keyof PunchItem, value: unknown) => {
    const items = f.items.map((it, j) => j === i ? { ...it, [key]: value } : it);
    set('items', items);
  };

  const emptyItem = (): PunchItem => ({ number: f.items.length + 1, location: '', description: '', responsible: '', date: '', status: 'pendiente' });

  const total = f.items.length;
  const done = f.items.filter(it => it.status === 'hecho').length;
  const pending = total - done;

  return (
    <div className="doc on">
      <p className="hint">Haz clic en cualquier campo para editar</p>
      <DocHeader docType="Punch List · Pendientes" />

      <div className="ot2">
        <div>
          <div className="lb">Cliente</div>
          <div className="ov"><EditableField value={f.clientName} onChange={(v) => set('clientName', v)} /></div>
        </div>
        <div>
          <div className="lb">Proyecto</div>
          <div className="ov"><EditableField value={f.projectName} onChange={(v) => set('projectName', v)} /></div>
        </div>
        <div>
          <div className="lb">Ref. Alcance (SOW)</div>
          <div className="ov"><EditableField value={f.sowRef} onChange={(v) => set('sowRef', v)} /></div>
        </div>
        <div>
          <div className="lb">Caminata realizada por</div>
          <div className="ov"><EditableField value={f.walkthroughBy} onChange={(v) => set('walkthroughBy', v)} /></div>
        </div>
        <div>
          <div className="lb">Fecha objetivo cierre</div>
          <div className="ov"><EditableField value={f.targetCloseDate} onChange={(v) => set('targetCloseDate', v)} /></div>
        </div>
      </div>

      <div className="sd">Pendientes identificados</div>
      <table>
        <thead>
          <tr>
            <th style={{ width: 30 }}>#</th>
            <th>Ubicación</th>
            <th>Descripción</th>
            <th>Responsable</th>
            <th className="r">Fecha</th>
            <th className="r" style={{ width: 60 }}>Estado</th>
            <th style={{ width: 24 }} />
          </tr>
        </thead>
        <tbody>
          {f.items.map((item, i) => (
            <tr key={i}>
              <td className="sm">{String(item.number).padStart(2, '0')}</td>
              <td><EditableField value={item.location} onChange={(v) => updateItem(i, 'location', v)} size={8} /></td>
              <td><EditableField value={item.description} onChange={(v) => updateItem(i, 'description', v)} size={22} multiline /></td>
              <td><EditableField value={item.responsible} onChange={(v) => updateItem(i, 'responsible', v)} size={10} /></td>
              <td className="r sm"><EditableField value={item.date} onChange={(v) => updateItem(i, 'date', v)} size={6} /></td>
              <td className="r">
                <select
                  value={item.status}
                  onChange={(e) => updateItem(i, 'status', e.target.value)}
                  style={{ font: 'inherit', fontSize: 11, background: 'transparent', border: 'none', cursor: 'pointer' }}
                >
                  {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </td>
              <td>
                <span className="row-actions">
                  <button className="row-del" onClick={() => set('items', f.items.filter((_, j) => j !== i))}>×</button>
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <button className="add-row-btn" onClick={() => set('items', [...f.items, emptyItem()])}>+ AÑADIR ÍTEM</button>

      <div style={{ display: 'flex', gap: 24, marginTop: 14, fontSize: 11, color: 'var(--p)', flexWrap: 'wrap' }}>
        <div>Total: <strong style={{ color: 'var(--c)' }}>{total}</strong></div>
        <div>Completados: <strong style={{ color: 'var(--accent)' }}>{done}</strong></div>
        <div>Pendientes: <strong style={{ color: 'var(--t)' }}>{pending}</strong></div>
      </div>

      <div className="sd">Observaciones</div>
      <div className="trm"><EditableField value={f.observations} onChange={(v) => set('observations', v)} multiline /></div>

      <SignatureBlock signers={[{ label: 'Cliente · Lista validada' }, { label: 'Maestro · Compromiso de cierre' }]} />
      <DocFooter />
    </div>
  );
}
