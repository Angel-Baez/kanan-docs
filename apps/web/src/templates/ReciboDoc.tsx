import type { RecFields } from '@kanan/shared';
import { DocHeader } from '../components/ui/DocHeader.tsx';
import { DocFooter } from '../components/ui/DocFooter.tsx';
import { EditableField } from '../components/ui/EditableField.tsx';
import { SignatureBlock } from '../components/ui/SignatureBlock.tsx';
import { useDocument } from '../context/DocumentContext.tsx';

function fmt(n: number) {
  return n.toLocaleString('es-DO', { minimumFractionDigits: 2 });
}

export function ReciboDoc() {
  const { fields, dispatch } = useDocument();
  const f = fields as RecFields;
  const set = (path: string, value: unknown) => dispatch({ type: 'SET_FIELD', path, value });

  return (
    <div className="doc on">
      <p className="hint">Haz clic en cualquier campo para editar</p>

      <DocHeader docType="Recibo de Pago" />

      <div className="sd">Datos del pago</div>
      <div style={{ fontSize: 12, color: 'var(--p)', marginBottom: 6 }}>Recibimos de</div>
      <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 14 }}>
        <EditableField value={f.clientName} onChange={(v) => set('clientName', v)} size={30} />
      </div>
      <div style={{ fontSize: 12, color: 'var(--p)', marginBottom: 4 }}>La cantidad de</div>
      <div className="rec-a">
        RD${' '}
        <EditableField
          value={String(f.amount)}
          onChange={(v) => set('amount', parseFloat(v) || 0)}
          numeric
          size={12}
        />
      </div>
      <div className="rec-w">
        (<EditableField value={f.amountWords} onChange={(v) => set('amountWords', v)} size={50} placeholder="monto en palabras" />)
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px 32px', margin: '18px 0' }}>
        <div>
          <div className="lb">Por concepto de</div>
          <div style={{ fontSize: 12, fontWeight: 500, marginTop: 4 }}>
            <EditableField value={f.concept} onChange={(v) => set('concept', v)} size={28} />
          </div>
        </div>
        <div>
          <div className="lb">Ref. Factura (FAC)</div>
          <div style={{ fontSize: 12, fontWeight: 500, marginTop: 4 }}>
            <EditableField value={f.facRef} onChange={(v) => set('facRef', v)} size={20} placeholder="FAC-2026-0001" />
          </div>
        </div>
        <div>
          <div className="lb">Forma de pago</div>
          <div style={{ fontSize: 12, fontWeight: 500, marginTop: 4 }}>
            <EditableField value={f.paymentMethod} onChange={(v) => set('paymentMethod', v)} size={20} />
          </div>
        </div>
        <div>
          <div className="lb">Confirmación banco</div>
          <div style={{ fontSize: 12, fontWeight: 500, marginTop: 4 }}>
            <EditableField value={f.bankConfirmation} onChange={(v) => set('bankConfirmation', v)} size={22} />
          </div>
        </div>
      </div>
      <div style={{ marginBottom: 4 }}>
        <div className="lb">Referencia adicional</div>
        <div style={{ fontSize: 12, marginTop: 4 }}>
          <EditableField value={f.reference} onChange={(v) => set('reference', v)} size={36} />
        </div>
      </div>

      <div className="trm">
        <EditableField value={f.balanceNote} onChange={(v) => set('balanceNote', v)} multiline placeholder="Nota de balance pendiente (opcional)" />
      </div>

      <SignatureBlock signers={[
        { label: 'Recibido por · Kanan Remodelaciones' },
        { label: 'Entregado por · Cliente' },
      ]} />

      <DocFooter />
    </div>
  );
}
