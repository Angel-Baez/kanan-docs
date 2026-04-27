import { useEffect } from 'react';
import type { PvFields } from '@kanan/shared';
import { DocHeader } from '../components/ui/DocHeader.tsx';
import { DocFooter } from '../components/ui/DocFooter.tsx';
import { EditableField } from '../components/ui/EditableField.tsx';
import { SignatureBlock } from '../components/ui/SignatureBlock.tsx';
import { useDocument } from '../context/DocumentContext.tsx';

function fmt(n: number) { return n.toLocaleString('es-DO', { minimumFractionDigits: 2 }); }

export function PropuestaVisualDoc() {
  const { fields, dispatch } = useDocument();
  const f = fields as PvFields;
  const set = (path: string, value: unknown) => dispatch({ type: 'SET_FIELD', path, value });

  // Auto-derive totalInvestment from phases (mismo patrón que EC/HT)
  useEffect(() => {
    const derived = f.phases.reduce((s, p) => s + (p.investment ?? 0), 0);
    if (derived !== f.totalInvestment) set('totalInvestment', derived);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [f.phases.map((p) => p.investment).join(',')]);

  return (
    <div className="doc on">
      <p className="hint">Haz clic en cualquier campo para editar</p>
      <DocHeader docType="Propuesta Visual" />

      <div style={{ margin: '32px 0 18px' }}>
        <div style={{ fontSize: 12, letterSpacing: '0.18em', color: 'var(--accent)', textTransform: 'uppercase', marginBottom: 14 }}>
          Propuesta para
        </div>
        <div style={{ fontFamily: 'Fraunces, Georgia, serif', fontStyle: 'italic', fontSize: 34, lineHeight: 1.2, color: 'var(--c)', marginBottom: 6 }}>
          <EditableField value={f.tagline} onChange={(v) => set('tagline', v)} size={32} placeholder="Tagline de la propuesta" />
        </div>
        <div style={{ fontSize: 14, color: 'var(--p)', lineHeight: 1.6 }}>
          <EditableField value={f.subtitle} onChange={(v) => set('subtitle', v)} size={50} placeholder="Subtítulo" multiline />
        </div>
      </div>

      <div className="cb">
        <div>
          <div className="lb">Para</div>
          <div className="cn"><EditableField value={f.clientName} onChange={(v) => set('clientName', v)} size={26} /></div>
          <div className="cs"><EditableField value={f.clientLocation} onChange={(v) => set('clientLocation', v)} size={26} /></div>
        </div>
        <div>
          <div className="lb">Proyecto</div>
          <div className="cn" style={{ fontSize: 12 }}><EditableField value={f.projectName} onChange={(v) => set('projectName', v)} size={26} /></div>
          <div className="cs" style={{ marginTop: 4 }}><EditableField value={f.projectSize} onChange={(v) => set('projectSize', v)} size={28} /></div>
        </div>
      </div>

      <div className="sd">Resumen ejecutivo</div>
      <div style={{ fontSize: 12.5, color: 'var(--c)', lineHeight: 1.75 }}>
        <EditableField value={f.executiveSummary} onChange={(v) => set('executiveSummary', v)} multiline />
      </div>

      <div style={{ margin: '30px 0', padding: '20px 0', borderTop: '1px solid var(--accent-soft)', borderBottom: '1px solid var(--accent-soft)', textAlign: 'center' }}>
        <div style={{ fontFamily: 'Fraunces, Georgia, serif', fontStyle: 'italic', fontSize: 20, lineHeight: 1.4, color: 'var(--c)' }}>
          "<EditableField value={f.pullQuote} onChange={(v) => set('pullQuote', v)} multiline />"
        </div>
      </div>

      <div className="sd">Nuestro enfoque</div>
      {f.approaches.map((a, i) => (
        <div key={i} className="pv-ap">
          <span className="pv-ac"><EditableField value={a.code} onChange={(v) => { const arr = f.approaches.map((x,j)=>j===i?{...x,code:v}:x); set('approaches',arr); }} size={2} /></span>
          <span className="pv-at"><EditableField value={a.title} onChange={(v) => { const arr = f.approaches.map((x,j)=>j===i?{...x,title:v}:x); set('approaches',arr); }} size={30} /></span>
          <div className="pv-ab"><EditableField value={a.body} onChange={(v) => { const arr = f.approaches.map((x,j)=>j===i?{...x,body:v}:x); set('approaches',arr); }} multiline /></div>
        </div>
      ))}
      <button className="add-row-btn" onClick={() => set('approaches', [...f.approaches, { code: String.fromCharCode(65 + f.approaches.length), title: '', body: '' }])}>+ PROPUESTA</button>

      <div className="sd">Plan de inversión</div>
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Fase</th>
            <th>Trabajos clave</th>
            <th className="r">Semanas</th>
            <th className="r">Inversión</th>
            <th style={{ width: 24 }} />
          </tr>
        </thead>
        <tbody>
          {f.phases.map((p, i) => (
            <tr key={i}>
              <td className="sm"><EditableField value={p.number} onChange={(v) => { const arr = f.phases.map((x,j)=>j===i?{...x,number:v}:x); set('phases',arr); }} size={4} /></td>
              <td><EditableField value={p.phase} onChange={(v) => { const arr = f.phases.map((x,j)=>j===i?{...x,phase:v}:x); set('phases',arr); }} size={18} /></td>
              <td><EditableField value={p.keyWorks} onChange={(v) => { const arr = f.phases.map((x,j)=>j===i?{...x,keyWorks:v}:x); set('phases',arr); }} size={30} /></td>
              <td className="r"><EditableField value={p.weeks} onChange={(v) => { const arr = f.phases.map((x,j)=>j===i?{...x,weeks:v}:x); set('phases',arr); }} size={4} /></td>
              <td className="r"><EditableField value={String(p.investment)} onChange={(v) => { const arr = f.phases.map((x,j)=>j===i?{...x,investment:parseFloat(v)||0}:x); set('phases',arr); }} numeric size={8} /></td>
              <td><span className="row-actions"><button className="row-del" onClick={() => set('phases', f.phases.filter((_,j)=>j!==i))}>×</button></span></td>
            </tr>
          ))}
        </tbody>
      </table>
      <button className="add-row-btn" onClick={() => set('phases', [...f.phases, { number:'', phase:'', keyWorks:'', weeks:'', investment:0 }])}>+ FASE</button>
      <div className="tot">
        <div className="ti g"><div className="tl">INVERSIÓN TOTAL</div><div className="tv">RD$ {fmt(f.totalInvestment)}</div></div>
      </div>
      <div className="pv-itbis">Incluye ITBIS · Detalle completo en cotización COT-2026-0001</div>

      <div className="sd">Por qué KANAN</div>
      <div className='why-grid'>
        {f.whyKanan.map( (w, i) => (
        <div key={i} className="why-item">
          <div className='pv-ac'>
             <EditableField
                value={w.number}
                onChange={(v) => {
                const arr = f.whyKanan.map((x, j) =>
                j === i ? { ...x, number: v } : x
                );
                set("whyKanan", arr);
                }}
                size={2}
              />
          </div>
          <div>
            <div className='pv-at'>
              <EditableField
                value={w.title}
                onChange={(v) => {
                const arr = f.whyKanan.map((x, j) =>
                j === i ? { ...x, title: v } : x
                );
                set("whyKanan", arr);
                }}
                size={18}
              />
            </div>
            <div className='pv-ab'>
              <EditableField
                value={w.body}
                onChange={(v) => {
                const arr = f.whyKanan.map((x, j) =>
                j === i ? { ...x, body: v } : x
                );
                set("whyKanan", arr);
                }}
                multiline
              />
            </div>
          </div>
        </div>
      ))}</div>
      <button className="add-row-btn" onClick={() => set('whyKanan', [...f.whyKanan, {
        number: String(f.whyKanan.length + 1).padStart(2, '0'),
        title: '',
        body: '',
      }])}>+ RAZÓN</button>

      <div className="pv-trm">
        <div className="pv-trm-title"><EditableField value={f.ctaTagline} onChange={(v) => set('ctaTagline', v)} size={18} placeholder="Título de la tarjeta" /></div>
        <div className="pv-trm-body">
          <EditableField value={f.ctaBody} onChange={(v) => set('ctaBody', v)} size={30} placeholder="Frase de llamado a la acción" multiline/>
        </div>
      </div>
      <div className='ot3'>
        <div>
          <div className='lb'>Validez</div>
          <div className='cn'>
            <EditableField value={f.validity} onChange={(v) => set('validity', v)} size={14}/>
          </div>
        </div>
        <div>
          <div className='lb'>Reservas tu fecha</div>
          <div className='cn'>
            <EditableField value={f.reserveCondition} onChange={(v) => set('reserveCondition', v)} size={16}/>
          </div>
        </div>
        <div>
          <div className='lb'>Contacto</div>
          <div className='cn'>
            <EditableField value={f.contactPhone} onChange={(v) => set('contactPhone', v)} size={14}/>
          </div>
        </div>
      </div>

      <SignatureBlock signers={[{ label: 'KANAN Remodelaciones' }, { label: f.clientName || 'Cliente' }]} />
      <DocFooter />
    </div>
  );
}
