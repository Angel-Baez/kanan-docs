import type { GrFields } from '@kanan/shared';
import { DocHeader } from '../components/ui/DocHeader.tsx';
import { DocFooter } from '../components/ui/DocFooter.tsx';
import { EditableField } from '../components/ui/EditableField.tsx';
import { SignatureBlock } from '../components/ui/SignatureBlock.tsx';
import { useDocument } from '../context/DocumentContext.tsx';

export function CartaGarantiaDoc() {
  const { fields, dispatch } = useDocument();
  const f = fields as GrFields;
  const set = (path: string, value: unknown) => dispatch({ type: 'SET_FIELD', path, value });

  const setListItem = (key: 'worksCovered' | 'exclusions', i: number, v: string) => {
    const arr = [...f[key]]; arr[i] = v; set(key, arr);
  };

  return (
    <div className="doc on">
      <p className="hint">Haz clic en cualquier campo para editar</p>
      <DocHeader docType="Carta de Garantía" />

      <div style={{ margin: '32px 0 18px' }}>
        <div style={{ fontSize: 12, letterSpacing: '0.18em', color: 'var(--accent)', textTransform: 'uppercase', marginBottom: 14 }}>
          Certificado de garantía
        </div>
        <div style={{ fontFamily: 'Fraunces, Georgia, serif', fontStyle: 'italic', fontSize: 28, lineHeight: 1.2, color: 'var(--c)', marginBottom: 6 }}>
          Lo que construimos contigo, lo respaldamos.
        </div>
      </div>

      <div className="cb">
        <div>
          <div className="lb">A favor de</div>
          <div className="cn"><EditableField value={f.clientName} onChange={(v) => set('clientName', v)} size={26} /></div>
          <div className="cs">Cédula: <EditableField value={f.clientCedula} onChange={(v) => set('clientCedula', v)} size={14} /></div>
        </div>
        <div>
          <div className="lb">Proyecto cubierto</div>
          <div className="cn" style={{ fontSize: 12 }}><EditableField value={f.projectName} onChange={(v) => set('projectName', v)} size={26} /></div>
          <div className="cs" style={{ marginTop: 4 }}><EditableField value={f.address1} onChange={(v) => set('address1', v)} size={30} />
            <br />
            <EditableField value={f.address2} onChange={(v) => set('address2', v)} size={30} /></div>
        </div>
      </div>

      <div className="ot2">
        <div>
          <div className="lb">Ref. SOW / Contrato</div>
          <div className="ov"><EditableField value={f.sowRef} onChange={(v) => set('sowRef', v)} /></div>
        </div>
        <div>
          <div className="lb">Acta de entrega</div>
          <div className="ov"><EditableField value={f.aeRef} onChange={(v) => set('aeRef', v)} /></div>
        </div>
        <div>
          <div className="lb">Inicio de garantía</div>
          <div className="ov"><EditableField value={f.warrantyStart} onChange={(v) => set('warrantyStart', v)} /></div>
        </div>
        <div>
          <div className="lb">Vencimiento</div>
          <div className="ov"><EditableField value={f.warrantyEnd} onChange={(v) => set('warrantyEnd', v)} /></div>
        </div>
      </div>

      <div className="sd">Período de cobertura</div>
      <div className="trm" style={{ marginTop: 0 }}>
        <EditableField value={f.coveragePeriodText} onChange={(v) => set('coveragePeriodText', v)} multiline />
      </div>

      <div className="sd">Trabajos cubiertos</div>
      <ul className="ul">
        {f.worksCovered.map((w, i) => (
          <li key={i}><EditableField value={w} onChange={(v) => setListItem('worksCovered', i, v)} size={58} /></li>
        ))}
      </ul>
      <button className="add-row-btn" onClick={() => set('worksCovered', [...f.worksCovered, ''])}>+ AÑADIR</button>

      <div className="sd">Exclusiones</div>
      <ul className="ul xl">
        {f.exclusions.map((e, i) => (
          <li key={i}><EditableField value={e} onChange={(v) => setListItem('exclusions', i, v)} size={58} /></li>
        ))}
      </ul>
      <button className="add-row-btn" onClick={() => set('exclusions', [...f.exclusions, ''])}>+ EXCLUSIÓN</button>

      <div className="sd">Cómo reclamar</div>
      <div className="trm" style={{ marginTop: 0 }}>
        <EditableField value={f.claimProcess} onChange={(v) => set('claimProcess', v)} multiline />
      </div>

      <SignatureBlock signers={[{ label: 'Kanan Remodelaciones' }]} />
      <DocFooter />
    </div>
  );
}
