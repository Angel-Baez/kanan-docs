import type { OtFields, BadgeStatus } from '@kanan/shared';
import { DocHeader } from '../components/ui/DocHeader.tsx';
import { DocFooter } from '../components/ui/DocFooter.tsx';
import { EditableField } from '../components/ui/EditableField.tsx';
import { SignatureBlock } from '../components/ui/SignatureBlock.tsx';
import { useDocument } from '../context/DocumentContext.tsx';

const STATUS_OPTIONS: { value: BadgeStatus; label: string; cls: string }[] = [
  { value: 'pendiente', label: 'Pendiente',  cls: 'badge bp' },
  { value: 'en-curso',  label: 'En curso',   cls: 'badge ba' },
  { value: 'hecho',     label: 'Completado', cls: 'badge bd' },
];

export function OrdenTrabajoDoc() {
  const { fields, dispatch } = useDocument();
  const f = fields as OtFields;
  const set = (path: string, value: unknown) => dispatch({ type: 'SET_FIELD', path, value });

  const updateTask = (i: number, key: string, value: unknown) => {
    const tasks = f.tasks.map((t, j) => j === i ? { ...t, [key]: value } : t);
    set('tasks', tasks);
  };

  const currentStatus = f.status ?? 'en-curso';
  const statusCls = STATUS_OPTIONS.find(s => s.value === currentStatus)?.cls ?? 'badge ba';
  const statusLabel = STATUS_OPTIONS.find(s => s.value === currentStatus)?.label ?? 'En curso';

  return (
    <div className="doc on">
      <p className="hint">Haz clic en cualquier campo para editar</p>
      <DocHeader docType="Orden de Trabajo" />

      <div className="cb">
        <div>
          <div className="lb">Cliente</div>
          <div className="cn"><EditableField value={f.clientName} onChange={(v) => set('clientName', v)} size={26} /></div>
          <div className="cs">Cédula: <EditableField value={f.clientCedula} onChange={(v) => set('clientCedula', v)} size={14} /></div>
        </div>
        <div>
          <div className="lb">Proyecto</div>
          <div className="cn" style={{ fontSize: 12 }}><EditableField value={f.projectName} onChange={(v) => set('projectName', v)} size={26} /></div>
          <div className="cs" style={{ marginTop: 4 }}>
            <EditableField value={f.address1} onChange={(v) => set('address1', v)} size={30} />
            <br />
            <EditableField value={f.address2} onChange={(v) => set('address2', v)} size={30} />
          </div>
        </div>
      </div>

      <div className="ot2">
        <div>
          <div className="lb">Técnico / Maestro</div>
          <div className="ov"><EditableField value={f.technician} onChange={(v) => set('technician', v)} /></div>
        </div>
        <div>
          <div className="lb">Supervisor</div>
          <div className="ov"><EditableField value={f.supervisor} onChange={(v) => set('supervisor', v)} /></div>
        </div>
        <div>
          <div className="lb">Fecha de inicio</div>
          <div className="ov"><EditableField value={f.startDate} onChange={(v) => set('startDate', v)} /></div>
        </div>
        <div>
          <div className="lb">Entrega estimada</div>
          <div className="ov"><EditableField value={f.estimatedDelivery} onChange={(v) => set('estimatedDelivery', v)} /></div>
        </div>
        <div>
          <div className="lb">Ref. SOW / COT</div>
          <div className="ov"><EditableField value={f.sowRef} onChange={(v) => set('sowRef', v)} /></div>
        </div>
        <div>
          <div className="lb">Estado</div>
          <div style={{ marginTop: 6 }}>
            <select
              value={currentStatus}
              onChange={(e) => set('status', e.target.value)}
              className={statusCls}
              style={{ font: 'inherit', fontSize: 11, background: 'transparent', border: 'none', cursor: 'pointer', padding: '2px 8px' }}
            >
              {STATUS_OPTIONS.map(s => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="sd">Tareas</div>
      <table>
        <thead>
          <tr>
            <th style={{ width: '46%' }}>Tarea</th>
            <th>Responsable</th>
            <th>Días</th>
            <th className="r">Estado</th>
            <th style={{ width: 24 }} />
          </tr>
        </thead>
        <tbody>
          {f.tasks.map((t, i) => (
            <tr key={i}>
              <td><EditableField value={t.description} onChange={(v) => updateTask(i, 'description', v)} size={26} /></td>
              <td><EditableField value={t.responsible} onChange={(v) => updateTask(i, 'responsible', v)} size={14} /></td>
              <td><EditableField value={t.days} onChange={(v) => updateTask(i, 'days', v)} size={4} /></td>
              <td className="r">
                <select
                  value={t.status}
                  onChange={(e) => updateTask(i, 'status', e.target.value)}
                  style={{ font: 'inherit', fontSize: 11, background: 'transparent', border: 'none', cursor: 'pointer' }}
                >
                  <option value="pendiente">Pendiente</option>
                  <option value="en-curso">En curso</option>
                  <option value="hecho">Hecho</option>
                </select>
              </td>
              <td>
                <span className="row-actions">
                  <button className="row-del" onClick={() => set('tasks', f.tasks.filter((_, j) => j !== i))}>×</button>
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <button className="add-row-btn" onClick={() => set('tasks', [...f.tasks, { description: '', responsible: '', days: '', status: 'pendiente' }])}>
        + AÑADIR TAREA
      </button>

      <div className="sd">Materiales clave</div>
      <div className="trm"><EditableField value={f.materials} onChange={(v) => set('materials', v)} multiline /></div>

      <div className="sd">Observaciones</div>
      <div className="trm"><EditableField value={f.observations} onChange={(v) => set('observations', v)} multiline /></div>

      <SignatureBlock signers={[{ label: 'Autorizado · Director de Operaciones' }, { label: 'Recibido · Maestro / Técnico' }]} />
      <DocFooter />
    </div>
  );
}
