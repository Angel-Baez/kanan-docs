import type { ArFields, ActionItem, BadgeStatus } from '@kanan/shared';
import { DocHeader } from '../components/ui/DocHeader.tsx';
import { DocFooter } from '../components/ui/DocFooter.tsx';
import { EditableField } from '../components/ui/EditableField.tsx';
import { SignatureBlock } from '../components/ui/SignatureBlock.tsx';
import { useDocument } from '../context/DocumentContext.tsx';

export function ActaReunionDoc() {
  const { fields, dispatch } = useDocument();
  const f = fields as ArFields;
  const set = (path: string, value: unknown) => dispatch({ type: 'SET_FIELD', path, value });

  return (
    <div className="doc on">
      <p className="hint">Haz clic en cualquier campo para editar</p>
      <DocHeader docType="Acta de Reunión" />

      <div className="cb">
        <div>
          <div className="lb">Proyecto</div>
          <div className="cn" style={{ fontSize: 12 }}><EditableField value={f.projectName} onChange={(v) => set('projectName', v)} size={26} /></div>
          <div className="cs">Cliente: <EditableField value={f.clientName} onChange={(v) => set('clientName', v)} size={22} /></div>
        </div>
        <div>
          <div className="lb">Lugar / modalidad</div>
          <div className="cs" style={{ fontSize: 12, color: 'var(--c)', fontWeight: 500 }}>
            <EditableField value={f.location} onChange={(v) => set('location', v)} size={28} />
          </div>
          <div className="cs" style={{ marginTop: 4 }}>Duración: <EditableField value={f.duration} onChange={(v) => set('duration', v)} size={14} /></div>
        </div>
      </div>

      <div className="sd">Asistentes</div>
      <table>
        <thead>
          <tr><th>Nombre</th><th>Rol</th><th className="r">Asistencia</th><th style={{ width: 24 }} /></tr>
        </thead>
        <tbody>
          {f.attendees.map((a, i) => (
            <tr key={i}>
              <td><EditableField value={a.name} onChange={(v) => { const arr = f.attendees.map((x, j) => j === i ? { ...x, name: v } : x); set('attendees', arr); }} size={22} /></td>
              <td className="sm"><EditableField value={a.role} onChange={(v) => { const arr = f.attendees.map((x, j) => j === i ? { ...x, role: v } : x); set('attendees', arr); }} size={18} /></td>
              <td className="r">
                <select value={a.status} onChange={(e) => { const arr = f.attendees.map((x, j) => j === i ? { ...x, status: e.target.value as 'Presente' | 'Ausente' } : x); set('attendees', arr); }} style={{ font: 'inherit', fontSize: 11, background: 'transparent', border: 'none', cursor: 'pointer' }}>
                  <option>Presente</option><option>Ausente</option>
                </select>
              </td>
              <td><span className="row-actions"><button className="row-del" onClick={() => set('attendees', f.attendees.filter((_, j) => j !== i))}>×</button></span></td>
            </tr>
          ))}
        </tbody>
      </table>
      <button className="add-row-btn" onClick={() => set('attendees', [...f.attendees, { name: '', role: '', status: 'Presente' }])}>+ ASISTENTE</button>

      <div className="sd">Agenda tratada</div>
      <ul className="ul">
        {f.agenda.map((item, i) => (
          <li key={i}>
            <EditableField value={item} onChange={(v) => { const arr = [...f.agenda]; arr[i] = v; set('agenda', arr); }} size={58} />
          </li>
        ))}
      </ul>
      <button className="add-row-btn" onClick={() => set('agenda', [...f.agenda, ''])}>+ PUNTO</button>

      <div className="sd">Decisiones tomadas</div>
      <table>
        <thead>
          <tr>
            <th style={{ width: 30 }}>#</th>
            <th>Decisión</th>
            <th>Justificación</th>
            <th style={{ width: 24 }} />
          </tr>
        </thead>
        <tbody>
          {f.decisions.map((d, i) => (
            <tr key={i}>
              <td className="sm">{String(i + 1).padStart(2, '0')}</td>
              <td><EditableField value={d.description} onChange={(v) => { const arr = f.decisions.map((x, j) => j === i ? { ...x, description: v } : x); set('decisions', arr); }} size={26} /></td>
              <td className="sm"><EditableField value={d.justification} onChange={(v) => { const arr = f.decisions.map((x, j) => j === i ? { ...x, justification: v } : x); set('decisions', arr); }} size={22} /></td>
              <td><span className="row-actions"><button className="row-del" onClick={() => set('decisions', f.decisions.filter((_, j) => j !== i))}>×</button></span></td>
            </tr>
          ))}
        </tbody>
      </table>
      <button className="add-row-btn" onClick={() => set('decisions', [...f.decisions, { description: '', justification: '' }])}>+ DECISIÓN</button>

      <div className="sd">Acción items</div>
      <table>
        <thead>
          <tr><th>Tarea</th><th>Responsable</th><th className="r">Fecha límite</th><th className="r">Estado</th><th style={{ width: 24 }} /></tr>
        </thead>
        <tbody>
          {f.actionItems.map((a: ActionItem, i: number) => (
            <tr key={i}>
              <td><EditableField value={a.task} onChange={(v) => { const arr = f.actionItems.map((x, j) => j === i ? { ...x, task: v } : x); set('actionItems', arr); }} size={24} /></td>
              <td className="sm"><EditableField value={a.responsible} onChange={(v) => { const arr = f.actionItems.map((x, j) => j === i ? { ...x, responsible: v } : x); set('actionItems', arr); }} size={14} /></td>
              <td className="r sm"><EditableField value={a.deadline} onChange={(v) => { const arr = f.actionItems.map((x, j) => j === i ? { ...x, deadline: v } : x); set('actionItems', arr); }} size={12} /></td>
              <td className="r">
                <select value={a.status} onChange={(e) => { const arr = f.actionItems.map((x, j) => j === i ? { ...x, status: e.target.value as BadgeStatus } : x); set('actionItems', arr); }} style={{ font: 'inherit', fontSize: 11, background: 'transparent', border: 'none', cursor: 'pointer' }}>
                  <option value="pendiente">Pendiente</option>
                  <option value="en-curso">En curso</option>
                  <option value="hecho">Hecho</option>
                </select>
              </td>
              <td><span className="row-actions"><button className="row-del" onClick={() => set('actionItems', f.actionItems.filter((_, j) => j !== i))}>×</button></span></td>
            </tr>
          ))}
        </tbody>
      </table>
      <button className="add-row-btn" onClick={() => set('actionItems', [...f.actionItems, { task: '', responsible: '', deadline: '', status: 'pendiente' }])}>+ ACCIÓN</button>

      <div className="sd">Próxima reunión</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px 20px' }}>
        <div>
          <div className="lb">Fecha</div>
          <div style={{ fontSize: 13, fontWeight: 700, marginTop: 3 }}>
            <EditableField value={f.nextMeeting.date} onChange={(v) => set('nextMeeting', { ...f.nextMeeting, date: v })} size={20} />
          </div>
        </div>
        <div>
          <div className="lb">Modalidad</div>
          <div style={{ fontSize: 13, fontWeight: 700, marginTop: 3 }}>
            <EditableField value={f.nextMeeting.modality} onChange={(v) => set('nextMeeting', { ...f.nextMeeting, modality: v })} size={18} />
          </div>
        </div>
        <div>
          <div className="lb">Tema</div>
          <div style={{ fontSize: 13, fontWeight: 700, marginTop: 3 }}>
            <EditableField value={f.nextMeeting.topic} onChange={(v) => set('nextMeeting', { ...f.nextMeeting, topic: v })} size={22} />
          </div>
        </div>
      </div>

      <SignatureBlock signers={[{ label: 'Cliente · Conformidad' }, { label: 'Levanta acta · Ángel Báez' }]} />
      <DocFooter />
    </div>
  );
}
