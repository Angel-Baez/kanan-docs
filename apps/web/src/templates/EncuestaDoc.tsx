import { useId } from 'react';
import type { EsFields } from '@kanan/shared';
import { DocHeader } from '../components/ui/DocHeader.tsx';
import { DocFooter } from '../components/ui/DocFooter.tsx';
import { EditableField } from '../components/ui/EditableField.tsx';
import { useDocument } from '../context/DocumentContext.tsx';

export function EncuestaDoc() {
  const { fields, dispatch } = useDocument();
  const f = fields as EsFields;
  const set = (path: string, value: unknown) => dispatch({ type: 'SET_FIELD', path, value });
  // Unique prefix per ES instance — evita colisiones si se renderean múltiples encuestas
  const radioId = useId();

  return (
    <div className="doc on">
      <p className="hint">Haz clic en cualquier campo para editar</p>
      <DocHeader docType="Encuesta de Satisfacción" />

      <div style={{ margin: '24px 0 18px' }}>
        <div style={{ fontFamily: 'Fraunces, Georgia, serif', fontStyle: 'italic', fontSize: 24, lineHeight: 1.3, color: 'var(--c)', marginBottom: 8 }}>
          Tu opinión nos hace mejor.
        </div>
        <div style={{ fontSize: 12.5, color: 'var(--p)', lineHeight: 1.6 }}>
          Cinco minutos. Cinco preguntas. Tu respuesta cambia cómo trabajamos para el próximo cliente. Gracias por ayudarnos a crecer.
        </div>
      </div>

      <div className="cb">
        <div>
          <div className="lb">Cliente</div>
          <div className="cn"><EditableField value={f.clientName} onChange={(v) => set('clientName', v)} size={26} /></div>
        </div>
        <div>
          <div className="lb">Proyecto / Fecha entrega</div>
          <div className="cs" style={{ fontSize: 12, color: 'var(--c)', fontWeight: 500 }}>
            <EditableField value={f.projectAndDate} onChange={(v) => set('projectAndDate', v)} size={28} />
          </div>
        </div>
      </div>

      <div className="sd">Califica del 1 al 5 (5 = excelente)</div>
      <table>
        <thead>
          <tr>
            <th style={{ width: '50%' }}>Aspecto</th>
            {[1, 2, 3, 4, 5].map(n => (
              <th key={n} className="r" style={{ width: 40 }}>{n}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {f.ratings.map((r, i) => (
            <tr key={i}>
              <td>
                <EditableField value={r.aspect} onChange={(v) => { const arr = f.ratings.map((x, j) => j === i ? { ...x, aspect: v } : x); set('ratings', arr); }} size={36} />
              </td>
              {[1, 2, 3, 4, 5].map(n => (
                <td key={n} className="r">
                  <input
                    type="radio"
                    name={`${radioId}-rating-${i}`}
                    checked={r.score === n}
                    onChange={() => { const arr = f.ratings.map((x, j) => j === i ? { ...x, score: n as 1|2|3|4|5 } : x); set('ratings', arr); }}
                    className="es-radio"
                    style={{ accentColor: 'var(--accent)', cursor: 'pointer' }}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      <div className="sd">¿Qué fue lo mejor?</div>
      <div className="trm" style={{ marginTop: 0, minHeight: 60 }}>
        <EditableField value={f.bestThings} onChange={(v) => set('bestThings', v)} multiline />
      </div>

      <div className="sd">¿Qué podríamos mejorar?</div>
      <div className="trm" style={{ marginTop: 0, minHeight: 60 }}>
        <EditableField value={f.improvements} onChange={(v) => set('improvements', v)} multiline />
      </div>

      <div className="ot2">
        <div>
          <div className="lb">¿Recomendarías Kanan?</div>
          <div style={{ marginTop: 6 }}>
            <select value={f.wouldRecommend} onChange={(e) => set('wouldRecommend', e.target.value)} style={{ font: 'inherit', fontSize: 12, fontWeight: 700, background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--accent)' }}>
              <option value="yes">Sí, sin dudarlo</option>
              <option value="maybe">Tal vez</option>
              <option value="no">No</option>
            </select>
          </div>
        </div>
        <div>
          <div className="lb">¿Podemos usar tu testimonio?</div>
          <div style={{ marginTop: 6 }}>
            <select value={f.testimonialConsent} onChange={(e) => set('testimonialConsent', e.target.value)} style={{ font: 'inherit', fontSize: 12, fontWeight: 700, background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--accent)' }}>
              <option value="named">Sí, con mi nombre</option>
              <option value="anonymous">Sí, anónimo</option>
              <option value="no">No</option>
            </select>
          </div>
        </div>
      </div>

      <div className="sd">Tu testimonio (opcional)</div>
      <div className="trm" style={{ marginTop: 0, minHeight: 50 }}>
        <EditableField value={f.testimonial} onChange={(v) => set('testimonial', v)} multiline />
      </div>

      <DocFooter />
    </div>
  );
}
