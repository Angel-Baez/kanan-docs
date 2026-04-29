import type { VtFields } from '@kanan/shared';
import { DocHeader } from '../components/ui/DocHeader.tsx';
import { DocFooter } from '../components/ui/DocFooter.tsx';
import { EditableField } from '../components/ui/EditableField.tsx';
import { SignatureBlock } from '../components/ui/SignatureBlock.tsx';
import { useDocument } from '../context/DocumentContext.tsx';

export function VisitaTecnicaDoc() {
  const { fields, dispatch } = useDocument();
  const f = fields as VtFields;
  const set = (path: string, value: unknown) => dispatch({ type: 'SET_FIELD', path, value });

  return (
    <div className="doc on">
      <p className="hint">Haz clic en cualquier campo para editar</p>
      <DocHeader docType="Visita Técnica" />

      <div className="cb">
        <div>
          <div className="lb">Cliente</div>
          <div className="cn"><EditableField value={f.clientName} onChange={(v) => set('clientName', v)} size={26} /></div>
          <div className="cs">
            <EditableField value={f.clientPhone} onChange={(v) => set('clientPhone', v)} size={14} />
            <br />
            <EditableField value={f.clientEmail} onChange={(v) => set('clientEmail', v)} size={24} />
          </div>
          <div className="lb" style={{ marginTop: 10 }}>Proyecto (opcional)</div>
          <div className="cs">
            <EditableField value={f.projectName ?? ''} onChange={(v) => set('projectName', v)} size={26} placeholder="nombre del proyecto" />
          </div>
        </div>
        <div>
          <div className="lb">Inmueble visitado</div>
          <div className="cs" style={{ fontSize: 12, color: 'var(--c)', fontWeight: 500 }}>
            <EditableField value={f.address1} onChange={(v) => set('address1', v)} size={28} />
            <br />
            <EditableField value={f.address2} onChange={(v) => set('address2', v)} size={28} />
          </div>
        </div>
      </div>

      <div className="ot2">
        <div>
          <div className="lb">Tipo de inmueble</div>
          <div className="ov"><EditableField value={f.propertyType} onChange={(v) => set('propertyType', v)} /></div>
        </div>
        <div>
          <div className="lb">Área total estimada</div>
          <div className="ov"><EditableField value={f.area} onChange={(v) => set('area', v)} size={2} /> m²</div>
        </div>
        <div>
          <div className="lb">Año de construcción</div>
          <div className="ov"><EditableField value={f.constructionYear} onChange={(v) => set('constructionYear', v)} size={8} /></div>
        </div>
        <div>
          <div className="lb">Tipo de cliente</div>
          <div className="ov"><EditableField value={f.clientType} onChange={(v) => set('clientType', v)} /></div>
        </div>
      </div>

      <div className="sd">Áreas a intervenir</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px 24px', fontSize: 12, marginBottom: 14 }}>
        {f.areasToIntervene.map((a, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <input
              type="checkbox"
              checked={a.checked}
              onChange={(e) => {
                const arr = f.areasToIntervene.map((x, j) => j === i ? { ...x, checked: e.target.checked } : x);
                set('areasToIntervene', arr);
              }}
              style={{ marginRight: 6 }}
            />
            <EditableField value={a.label} onChange={(v) => {
              const arr = f.areasToIntervene.map((x, j) => j === i ? { ...x, label: v } : x);
              set('areasToIntervene', arr);
            }} size={18} />
            <span className="row-actions">
              <button className="row-del" onClick={() => set('areasToIntervene', f.areasToIntervene.filter((_, j) => j !== i))}>×</button>
            </span>
          </div>
        ))}
      </div>
      <button className="add-row-btn" onClick={() => set('areasToIntervene', [...f.areasToIntervene, { label: '', checked: false }])}>+ ÁREA</button>

      <div className="sd">Estado actual del inmueble</div>
      <div className="trm" style={{ marginTop: 0, minHeight: 50 }}>
        <EditableField value={f.currentCondition} onChange={(v) => set('currentCondition', v)} multiline />
      </div>

      <div className="sd">Trabajos solicitados por el cliente</div>
      <ul className="ul">
        {f.requestedWorks.map((w, i) => (
          <li key={i}>
            <EditableField value={w} onChange={(v) => { const arr = [...f.requestedWorks]; arr[i] = v; set('requestedWorks', arr); }} size={58} />
          </li>
        ))}
      </ul>
      <button className="add-row-btn" onClick={() => set('requestedWorks', [...f.requestedWorks, ''])}>+ AÑADIR</button>

      <div className="sd">Medidas levantadas</div>
      <table>
        <thead>
          <tr><th>Espacio</th><th>Largo</th><th>Ancho</th><th>Alto</th><th className="r">Área m²</th><th style={{ width: 24 }} /></tr>
        </thead>
        <tbody>
          {f.measurements.map((m, i) => {
            const update = (key: string, v: unknown) => {
              const arr = f.measurements.map((x, j) => {
                if (j !== i) return x;
                const next = { ...x, [key]: v };
                if (key === 'length' || key === 'width') {
                  next.area = parseFloat(String(next.length)) * parseFloat(String(next.width)) || 0;
                }
                return next;
              });
              set('measurements', arr);
            };
            return (
              <tr key={i}>
                <td><EditableField value={m.space} onChange={(v) => update('space', v)} size={16} /></td>
                <td className="sm"><EditableField value={m.length} onChange={(v) => update('length', v)} numeric size={6} /></td>
                <td className="sm"><EditableField value={m.width} onChange={(v) => update('width', v)} numeric size={6} /></td>
                <td className="sm"><EditableField value={m.height} onChange={(v) => update('height', v)} numeric size={6} /></td>
                <td className="r">{(m.area || 0).toFixed(2)}</td>
                <td><span className="row-actions"><button className="row-del" onClick={() => set('measurements', f.measurements.filter((_, j) => j !== i))}>×</button></span></td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <button className="add-row-btn" onClick={() => set('measurements', [...f.measurements, { space: '', length: '', width: '', height: '', area: 0 }])}>+ ESPACIO</button>

      <div className="sd">Materiales / referencias del cliente</div>
      <div className="trm" style={{ marginTop: 0 }}><EditableField value={f.clientReferences} onChange={(v) => set('clientReferences', v)} multiline /></div>

      <div className="sd">Restricciones / logística</div>
      <div className="trm" style={{ marginTop: 0 }}><EditableField value={f.logisticsRestrictions} onChange={(v) => set('logisticsRestrictions', v)} multiline /></div>

      <div className="sd">Estimado preliminar</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px 20px' }}>
        <div>
          <div className="lb">Rango estimado</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--accent)', marginTop: 3 }}>
            RD$ <EditableField value={f.estimatedRange} onChange={(v) => set('estimatedRange', v)} size={12} />
          </div>
        </div>
        <div>
          <div className="lb">Plazo estimado</div>
          <div style={{ fontSize: 13, fontWeight: 700, marginTop: 3 }}>
            <EditableField value={f.estimatedDuration} onChange={(v) => set('estimatedDuration', v)} size={18} />
          </div>
        </div>
        <div>
          <div className="lb">Inicio posible</div>
          <div style={{ fontSize: 13, fontWeight: 700, marginTop: 3 }}>
            <EditableField value={f.possibleStart} onChange={(v) => set('possibleStart', v)} size={22} />
          </div>
        </div>
      </div>

      <div className="sd">Próximos pasos</div>
      <div className="trm" style={{ marginTop: 0 }}><EditableField value={f.nextSteps} onChange={(v) => set('nextSteps', v)} multiline /></div>

      <SignatureBlock signers={[{ label: 'Visita realizada por · Kanan Remodelaciones' }, { label: 'Cliente · Conformidad de levantamiento' }]} />
      <DocFooter />
    </div>
  );
}
