import type { OcFields } from '@kanan/shared';
import { DocHeader } from '../components/ui/DocHeader.tsx';
import { DocFooter } from '../components/ui/DocFooter.tsx';
import { EditableField } from '../components/ui/EditableField.tsx';
import { LineItemTable } from '../components/ui/LineItemTable.tsx';
import { SignatureBlock } from '../components/ui/SignatureBlock.tsx';
import { useDocument } from '../context/DocumentContext.tsx';

function fmt(n: number) {
  return n.toLocaleString('es-DO', { minimumFractionDigits: 2 });
}

export function OrdenCambioDoc() {
  const { fields, dispatch } = useDocument();
  const f = fields as OcFields;
  const set = (path: string, value: unknown) => dispatch({ type: 'SET_FIELD', path, value });

  return (
    <div className="doc on">
      <p className="hint">Haz clic en cualquier campo para editar</p>
      <DocHeader docType="Orden de Cambio" />

      <div className="ot2">
        <div>
          <div className="lb">Cliente</div>
          <div className="ov"><EditableField value={f.clientName} onChange={(v) => set('clientName', v)} /></div>
        </div>
        <div>
          <div className="lb">Proyecto</div>
          <div className="ov"><EditableField value={f.projectName} onChange={(v) => set('projectName', v)} /></div>
        </div>
        <div>
          <div className="lb">Ref. SOW / OT original</div>
          <div className="ov"><EditableField value={f.sowRef} onChange={(v) => set('sowRef', v)} /></div>
        </div>
        <div>
          <div className="lb">Solicitado por</div>
          <div className="ov"><EditableField value={f.requestedBy} onChange={(v) => set('requestedBy', v)} /></div>
        </div>
      </div>

      <div className="sd">Descripción del cambio</div>
      <div className="trm"><EditableField value={f.changeDescription} onChange={(v) => set('changeDescription', v)} multiline /></div>

      <div className="sd">Justificación / razón</div>
      <div className="trm"><EditableField value={f.justification} onChange={(v) => set('justification', v)} multiline /></div>

      <div className="sd">Partidas adicionales</div>
      <LineItemTable showItbis={true} />

      <div className="sd">Impacto consolidado</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px 20px' }}>
        <div>
          <div className="lb">Contrato original</div>
          <div style={{ fontSize: 13, fontWeight: 700, marginTop: 3 }}>
            RD$ <EditableField value={String(f.originalContractAmount)} onChange={(v) => set('originalContractAmount', parseFloat(v.replace(/,/g, '')) || 0)} numeric size={12} />
          </div>
        </div>
        <div>
          <div className="lb">Esta orden de cambio</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent)', marginTop: 3 }}>
            + RD$ {fmt(f.total)}
          </div>
        </div>
        <div>
          <div className="lb">Total ajustado</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--accent)', marginTop: 3 }}>
            RD$ {fmt(f.originalContractAmount + f.total)}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px 32px', marginTop: 18 }}>
        <div>
          <div className="lb">Días adicionales</div>
          <div style={{ fontSize: 13, fontWeight: 700, marginTop: 3 }}>
            <EditableField value={f.additionalDays} onChange={(v) => set('additionalDays', v)} size={20} />
          </div>
        </div>
        <div>
          <div className="lb">Nueva fecha de entrega</div>
          <div style={{ fontSize: 13, fontWeight: 700, marginTop: 3 }}>
            <EditableField value={f.newDeliveryDate} onChange={(v) => set('newDeliveryDate', v)} size={18} />
          </div>
        </div>
      </div>

      <div className="trm" style={{ marginTop: 18 }}>
        <EditableField value={f.terms} onChange={(v) => set('terms', v)} multiline placeholder="Términos y condiciones" />
      </div>

      <SignatureBlock signers={[{ label: 'Aprobado · Cliente' }, { label: 'Kanan Remodelaciones · Director' }]} />
      <DocFooter />
    </div>
  );
}
