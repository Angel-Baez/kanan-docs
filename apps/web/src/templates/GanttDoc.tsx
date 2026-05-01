import type { GanttFields } from '@kanan/shared';
import { DocHeader } from '../components/ui/DocHeader.tsx';
import { DocFooter } from '../components/ui/DocFooter.tsx';
import { EditableField } from '../components/ui/EditableField.tsx';
import { GanttChart } from '../components/gantt/GanttChart.tsx';
import { useDocument } from '../context/DocumentContext.tsx';

export function GanttDoc() {
  const { fields, dispatch } = useDocument();
  const f = fields as GanttFields;
  const set = (path: string, value: unknown) => dispatch({ type: 'SET_FIELD', path, value });

  return (
    <div className="doc on">
      <p className="hint">Clic en celdas para ajustar semanas · Clic en colores para cambiar fase</p>
      <DocHeader docType="Cronograma de Obra" />

      <div className="cb">
        <div>
          <div className="lb">Proyecto</div>
          <div className="cn"><EditableField value={f.projectName} onChange={(v) => set('projectName', v)} size={26} /></div>
        </div>
        <div>
          <div className="lb">Cliente</div>
          <div className="cn"><EditableField value={f.clientName} onChange={(v) => set('clientName', v)} size={16} /></div>
        </div>
        <div>
          <div className="lb">Período</div>
          <div className="cn"><EditableField value={f.period} onChange={(v) => set('period', v)} size={22} /></div>
        </div>
        <div>
          <div className="lb">Ref. Alcance (SOW)</div>
          <div className="ov"><EditableField value={f.sowRef} onChange={(v) => set('sowRef', v)} /></div>
        </div>
      </div>

      <div className="sd">Cronograma (8 semanas)</div>
      <GanttChart
        phases={f.phases}
        onChange={(phases) => set('phases', phases)}
        editable
      />

      <div style={{ display: 'flex', gap: 20, marginTop: 14, flexWrap: 'wrap' }}>
        {[
          { color: 'var(--t)', label: 'Preparación', opacity: 0.85 },
          { color: 'var(--o)', label: 'Instalación', opacity: 0.85 },
          { color: 'var(--c)', label: 'Acabados', opacity: 0.65 },
        ].map(({ color, label, opacity }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--p)' }}>
            <div style={{ width: 20, height: 10, background: color, borderRadius: 1, opacity }} />
            {label}
          </div>
        ))}
      </div>

      <DocFooter />
    </div>
  );
}
