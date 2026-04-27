import type { CotFields } from '@kanan/shared';
import { DocHeader } from '../components/ui/DocHeader.tsx';
import { DocFooter } from '../components/ui/DocFooter.tsx';
import { EditableField } from '../components/ui/EditableField.tsx';
import { LineItemTable } from '../components/ui/LineItemTable.tsx';
import { SignatureBlock } from '../components/ui/SignatureBlock.tsx';
import { useDocument } from '../context/DocumentContext.tsx';

export function CotizacionDoc() {
  const { fields, dispatch } = useDocument();
  const f = fields as CotFields;

  const set = (path: string, value: unknown) =>
    dispatch({ type: 'SET_FIELD', path, value });

  return (
    <div className="doc on">
      <p className="hint">Haz clic en cualquier campo para editar · Los totales se calculan automáticamente</p>

      <DocHeader docType="Cotización" extraDateLabel="Válida hasta:" extraDateField="validUntil" />

      {/* Client + Project */}
      <div className="cb">
        <div>
          <div className="lb">Cliente</div>
          <div className="cn">
            <EditableField value={f.clientName} onChange={(v) => set('clientName', v)} size={28} />
          </div>
          <div className="cs">
            <EditableField value={f.clientPhone} onChange={(v) => set('clientPhone', v)} size={16} />
            <br />
            <EditableField value={f.clientEmail} onChange={(v) => set('clientEmail', v)} size={24} />
          </div>
        </div>
        <div>
          <div className="lb">Proyecto / Dirección</div>
          <div className="cs" style={{ fontSize: 12, color: 'var(--c)', fontWeight: 500 }}>
            <EditableField value={f.projectName} onChange={(v) => set('projectName', v)} size={32} />
            <br />
            <EditableField value={f.address1} onChange={(v) => set('address1', v)} size={36} />
            <br />
            <EditableField value={f.address2} onChange={(v) => set('address2', v)} size={36} />
          </div>
        </div>
      </div>

      {/* References */}
      <div className="ot2" style={{ marginBottom: 0 }}>
        <div>
          <div className="lb">Ref. Visita Técnica (VT)</div>
          <div className="ov"><EditableField value={f.vtRef} onChange={(v) => set('vtRef', v)} /></div>
        </div>
      </div>

      {/* Items */}
      <div className="sd">Detalle de trabajos</div>
      <LineItemTable showItbis={true} />

      {/* Conditions */}
      <div className="trm">
        <div className="lb" style={{ marginBottom: 5 }}>Condiciones</div>
        <EditableField value={f.conditions} onChange={(v) => set('conditions', v)} multiline />
      </div>

      <SignatureBlock signers={[
        { label: 'Firma cliente · Aprobación' },
        { label: 'Kanan Remodelaciones · Director' },
      ]} />

      <DocFooter />
    </div>
  );
}
