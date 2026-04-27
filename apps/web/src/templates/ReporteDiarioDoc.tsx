import type { RdFields, BadgeStatus } from '@kanan/shared';
import { DocHeader } from '../components/ui/DocHeader.tsx';
import { DocFooter } from '../components/ui/DocFooter.tsx';
import { EditableField } from '../components/ui/EditableField.tsx';
import { SignatureBlock } from '../components/ui/SignatureBlock.tsx';
import { useDocument } from '../context/DocumentContext.tsx';

export function ReporteDiarioDoc() {
  const { fields, dispatch } = useDocument();
  const f = fields as RdFields;
  const set = (path: string, value: unknown) => dispatch({ type: 'SET_FIELD', path, value });

  const setListItem = (key: 'worksDone' | 'materialsReceived', i: number, v: string) => {
    const arr = [...f[key]]; arr[i] = v; set(key, arr);
  };

  return (
    <div className="doc on">
      <p className="hint">Haz clic en cualquier campo para editar</p>
      <DocHeader docType="Reporte Diario de Obra" />

      <div className="ot2">
        <div>
          <div className="lb">Proyecto</div>
          <div className="ov"><EditableField value={f.projectName} onChange={(v) => set('projectName', v)} /></div>
        </div>
        <div>
          <div className="lb">Ref. Orden de Trabajo (OT)</div>
          <div className="ov"><EditableField value={f.otRef} onChange={(v) => set('otRef', v)} /></div>
        </div>
        <div>
          <div className="lb">Día de obra</div>
          <div className="ov"><EditableField value={f.dayOf} onChange={(v) => set('dayOf', v)} /></div>
        </div>
        <div>
          <div className="lb">Supervisor de campo</div>
          <div className="ov"><EditableField value={f.supervisor} onChange={(v) => set('supervisor', v)} /></div>
        </div>
        <div>
          <div className="lb">Clima / condiciones</div>
          <div className="ov"><EditableField value={f.weather} onChange={(v) => set('weather', v)} /></div>
        </div>
      </div>

      <div className="sd">Personal en obra</div>
      <table>
        <thead>
          <tr><th>Nombre</th><th>Rol</th><th>Entrada</th><th>Salida</th><th className="r">Horas</th><th style={{ width: 24 }} /></tr>
        </thead>
        <tbody>
          {f.personnel.map((p, i) => (
            <tr key={i}>
              <td><EditableField value={p.name} onChange={(v) => { const a = f.personnel.map((x,j)=>j===i?{...x,name:v}:x); set('personnel',a); }} size={20} /></td>
              <td><EditableField value={p.role} onChange={(v) => { const a = f.personnel.map((x,j)=>j===i?{...x,role:v}:x); set('personnel',a); }} size={14} /></td>
              <td><EditableField value={p.entry} onChange={(v) => { const a = f.personnel.map((x,j)=>j===i?{...x,entry:v}:x); set('personnel',a); }} size={6} /></td>
              <td><EditableField value={p.exit} onChange={(v) => { const a = f.personnel.map((x,j)=>j===i?{...x,exit:v}:x); set('personnel',a); }} size={6} /></td>
              <td className="r"><EditableField value={String(p.hours)} onChange={(v) => { const a = f.personnel.map((x,j)=>j===i?{...x,hours:parseFloat(v)||0}:x); set('personnel',a); }} numeric size={4} /></td>
              <td><span className="row-actions"><button className="row-del" onClick={() => set('personnel', f.personnel.filter((_,j)=>j!==i))}>×</button></span></td>
            </tr>
          ))}
        </tbody>
      </table>
      <button className="add-row-btn" onClick={() => set('personnel', [...f.personnel, { name:'', role:'', entry:'8:00', exit:'5:00', hours:8 }])}>+ PERSONAL</button>

      <div className="sd">Trabajos ejecutados hoy</div>
      <ul className="ul">
        {f.worksDone.map((w, i) => (
          <li key={i}><EditableField value={w} onChange={(v) => setListItem('worksDone', i, v)} size={58} /></li>
        ))}
      </ul>
      <button className="add-row-btn" onClick={() => set('worksDone', [...f.worksDone, ''])}>+ AÑADIR</button>

      <div className="sd">Materiales recibidos</div>
      <ul className="ul">
        {f.materialsReceived.map((m, i) => (
          <li key={i}><EditableField value={m} onChange={(v) => setListItem('materialsReceived', i, v)} size={58} /></li>
        ))}
      </ul>
      <button className="add-row-btn" onClick={() => set('materialsReceived', [...f.materialsReceived, ''])}>+ AÑADIR</button>

      <div className="sd">Incidencias / observaciones</div>
      <div className="trm"><EditableField value={f.incidents} onChange={(v) => set('incidents', v)} multiline /></div>

      <div className="sd">Avance</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px 20px' }}>
        <div>
          <div className="lb">% Avance global</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--accent)', marginTop: 3 }}>
            <EditableField value={f.progressPercent} onChange={(v) => set('progressPercent', v)} size={6} />
          </div>
        </div>
        <div>
          <div className="lb">Días transcurridos</div>
          <div style={{ fontSize: 13, fontWeight: 700, marginTop: 5 }}>
            <EditableField value={f.daysElapsed} onChange={(v) => set('daysElapsed', v)} size={10} />
          </div>
        </div>
        <div>
          <div className="lb">vs. cronograma</div>
          <div style={{ marginTop: 6 }}>
            <select
              value={f.scheduleStatus}
              onChange={(e) => set('scheduleStatus', e.target.value as BadgeStatus)}
              style={{ font: 'inherit', fontSize: 11, background: 'transparent', border: 'none', cursor: 'pointer' }}
            >
              <option value="en-curso">En tiempo</option>
              <option value="pendiente">Atrasado</option>
              <option value="hecho">Adelantado</option>
            </select>
          </div>
        </div>
      </div>

      <div className="sd">Plan para mañana</div>
      <div className="trm"><EditableField value={f.planTomorrow} onChange={(v) => set('planTomorrow', v)} multiline /></div>

      <SignatureBlock signers={[
        { label: `Supervisor de campo · Reporta` },
        { label: 'Director de Operaciones · Visto bueno' },
      ]} />
      <DocFooter />
    </div>
  );
}
