import type { FacFields } from '@kanan/shared';
import { DocHeader } from '../components/ui/DocHeader.tsx';
import { DocFooter } from '../components/ui/DocFooter.tsx';
import { EditableField } from '../components/ui/EditableField.tsx';
import { LineItemTable } from '../components/ui/LineItemTable.tsx';
import { SignatureBlock } from '../components/ui/SignatureBlock.tsx';
import { useDocument } from '../context/DocumentContext.tsx';

export function FacturaDoc() {
  const { fields, dispatch } = useDocument();
  const f = fields as FacFields;
  const set = (path: string, value: unknown) => dispatch({ type: 'SET_FIELD', path, value });

  return (
    <div className="doc on">
      <p className="hint">Haz clic en cualquier campo para editar</p>

      <DocHeader docType="Factura" />

      {/* NCF Block */}
      <div className="ncf">
        <div>
          <div className="ncf-l">NCF</div>
          <div className="ncf-v">
            <EditableField value={f.ncf} onChange={(v) => set('ncf', v)} size={16} />
          </div>
        </div>
        <div>
          <div className="ncf-l">Tipo</div>
          <div className="ncf-v">
            <EditableField value={f.ncfType} onChange={(v) => set('ncfType', v)} size={16} />
          </div>
        </div>
        <div>
          <div className="ncf-l">RNC Proveedor</div>
          <div className="ncf-v">
            <EditableField value={f.rnc} onChange={(v) => set('rnc', v)} size={12} />
          </div>
        </div>
      </div>

      {/* Client + Project */}
      <div className="cb">
        <div>
          <div className="lb">Facturar a</div>
          <div className="cn">
            <EditableField value={f.clientName} onChange={(v) => set('clientName', v)} size={26} />
          </div>
          <div className="cs">
            Cédula: <EditableField value={f.clientCedula} onChange={(v) => set('clientCedula', v)} size={14} />
            <br />
            <EditableField value={f.clientPhone} onChange={(v) => set('clientPhone', v)} size={14} />
          </div>
        </div>
        <div>
          <div className="lb">Proyecto · Ref.</div>
          <div className="cn" style={{ fontSize: 12 }}>
            <EditableField value={f.projectName} onChange={(v) => set('projectName', v)} size={26} />
          </div>
          <div className="cs" style={{ marginTop: 6 }}>
            Ref. COT: <EditableField value={f.cotRef} onChange={(v) => set('cotRef', v)} size={16} />
          </div>
        </div>
      </div>

      {/* Items */}
      <div className="sd">Detalle de facturación</div>
      <LineItemTable showItbis={true} />

      {/* Payment conditions */}
      <div className="sd">Condiciones de pago</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px 32px', marginBottom: 16 }}>
        <div>
          <div className="lb">Método</div>
          <div style={{ fontSize: 12, fontWeight: 500, marginTop: 4 }}>
            <EditableField value={f.paymentMethod} onChange={(v) => set('paymentMethod', v)} size={22} />
          </div>
        </div>
        <div>
          <div className="lb">Vencimiento</div>
          <div style={{ fontSize: 12, fontWeight: 500, marginTop: 4 }}>
            <EditableField value={f.dueDate} onChange={(v) => set('dueDate', v)} size={20} />
          </div>
        </div>
        <div>
          <div className="lb">Banco destino</div>
          <div className="cs" style={{ marginTop: 4 }}>
            <EditableField value={f.bankName} onChange={(v) => set('bankName', v)} size={24} />
            <br />Cta: <EditableField value={f.bankAccount} onChange={(v) => set('bankAccount', v)} size={16} />
          </div>
        </div>
        <div>
          <div className="lb">Estado</div>
          <div style={{ marginTop: 6 }}>
            <select
              value={f.paymentStatus ?? 'pendiente'}
              onChange={(e) => set('paymentStatus', e.target.value)}
              className={(f.paymentStatus ?? 'pendiente') === 'pendiente' ? 'badge bp' : 'badge bd'}
              style={{ font: 'inherit', fontSize: 11, background: 'transparent', border: 'none', cursor: 'pointer', padding: '2px 8px' }}
            >
              <option value="pendiente">Pendiente</option>
              <option value="hecho">Cobrada</option>
            </select>
          </div>
        </div>
      </div>

      <SignatureBlock signers={[
        { label: 'Recibí conforme · Cliente' },
        { label: 'Emitido por · Kanan Remodelaciones' },
      ]} />

      <DocFooter />
    </div>
  );
}
