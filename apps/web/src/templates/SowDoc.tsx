import type { SowFields } from '@kanan/shared';
import { DocHeader } from '../components/ui/DocHeader.tsx';
import { DocFooter } from '../components/ui/DocFooter.tsx';
import { EditableField } from '../components/ui/EditableField.tsx';
import { SignatureBlock } from '../components/ui/SignatureBlock.tsx';
import { useDocument } from '../context/DocumentContext.tsx';

function fmt(n: number) {
  return n.toLocaleString('es-DO', { minimumFractionDigits: 2 });
}

export function SowDoc() {
  const { fields, dispatch } = useDocument();
  const f = fields as SowFields;
  const set = (path: string, value: unknown) => dispatch({ type: 'SET_FIELD', path, value });

  const setListItem = (key: 'scopeIncluded' | 'scopeExcluded', i: number, v: string) => {
    const arr = [...f[key]];
    arr[i] = v;
    set(key, arr);
  };

  const addListItem = (key: 'scopeIncluded' | 'scopeExcluded') =>
    set(key, [...f[key], '']);

  return (
    <div className="doc on">
      <p className="hint">Haz clic en cualquier campo para editar</p>

      <DocHeader docType="Alcance de Trabajo · SOW" />

      <div className="cb">
        <div>
          <div className="lb">Contratante</div>
          <div className="cn">
            <EditableField value={f.clientName} onChange={(v) => set('clientName', v)} size={26} />
          </div>
          <div className="cs">
            Cédula: <EditableField value={f.clientCedula} onChange={(v) => set('clientCedula', v)} size={14} />
            <br />
            <EditableField value={f.clientPhone} onChange={(v) => set('clientPhone', v)} size={16} />
          </div>
        </div>
        <div>
          <div className="lb">Proyecto</div>
          <div className="cn" style={{ fontSize: 12 }}>
            <EditableField value={f.projectName} onChange={(v) => set('projectName', v)} size={26} />
          </div>
          <div className="cs" style={{ marginTop: 4 }}>
            <EditableField value={f.address1} onChange={(v) => set('address1', v)} size={30} />
            <br />
            <EditableField value={f.address2} onChange={(v) => set('address2', v)} size={30} />
            <br />Inicio: <EditableField value={f.startDate} onChange={(v) => set('startDate', v)} size={12} /> · Fin: <EditableField value={f.endDate} onChange={(v) => set('endDate', v)} size={12} />
          </div>
        </div>
      </div>

      <div className="ot2" style={{ marginBottom: 20 }}>
        <div>
          <div className="lb">Ref. Cotización (COT)</div>
          <div className="ov"><EditableField value={f.cotRef} onChange={(v) => set('cotRef', v)} /></div>
        </div>
      </div>

      <div className="sd">Incluido en el alcance</div>
      <ul className="ul">
        {f.scopeIncluded.map((item, i) => (
          <li key={i}>
            <EditableField value={item} onChange={(v) => setListItem('scopeIncluded', i, v)} size={60} />
          </li>
        ))}
      </ul>
      <button className="add-row-btn" onClick={() => addListItem('scopeIncluded')}>
        + AÑADIR ÍTEM
      </button>

      <div className="sd">No incluido</div>
      <ul className="ul xl">
        {f.scopeExcluded.map((item, i) => (
          <li key={i}>
            <EditableField value={item} onChange={(v) => setListItem('scopeExcluded', i, v)} size={60} />
          </li>
        ))}
      </ul>
      <button className="add-row-btn" onClick={() => addListItem('scopeExcluded')}>
        + AÑADIR EXCLUSIÓN
      </button>

      <div className="sd">Forma de pago</div>
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(f.tranches.length, 3)}, 1fr)`, gap: '12px 20px', marginBottom: 4 }}>
        {f.tranches.map((t, i) => (
          <div key={i}>
            <div className="lb">
              <EditableField value={t.label} onChange={(v) => {
                const arr = f.tranches.map((x, j) => j === i ? { ...x, label: v } : x);
                set('tranches', arr);
              }} size={22} />
            </div>
            <div style={{ fontFamily: 'Archivo, sans-serif', fontSize: 24, fontWeight: 900, color: 'var(--accent)', marginTop: 4 }}>
              <EditableField value={String(t.percentage)} onChange={(v) => {
                const arr = f.tranches.map((x, j) => j === i ? { ...x, percentage: parseFloat(v) || 0 } : x);
                set('tranches', arr);
              }} numeric size={3} />%
            </div>
            <div className="cs">
              RD$ <EditableField value={String(t.amount)} onChange={(v) => {
                const arr = f.tranches.map((x, j) => j === i ? { ...x, amount: parseFloat(v) || 0 } : x);
                set('tranches', arr);
              }} numeric size={12} />
            </div>
          </div>
        ))}
      </div>

      <div className="trm" style={{ marginTop: 18 }}>
        <div className="lb" style={{ marginBottom: 5 }}>Garantía</div>
        <EditableField value={f.warrantyText} onChange={(v) => set('warrantyText', v)} multiline />
      </div>

      <SignatureBlock signers={[
        { label: `Firma contratante · ${f.clientName || 'Cliente'}` },
        { label: 'Kanan Remodelaciones · Director' },
      ]} />

      <DocFooter />
    </div>
  );
}
