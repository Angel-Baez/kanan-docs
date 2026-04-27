import { useEffect } from 'react';
import type { AeFields } from '@kanan/shared';
import { DocHeader } from '../components/ui/DocHeader.tsx';
import { DocFooter } from '../components/ui/DocFooter.tsx';
import { EditableField } from '../components/ui/EditableField.tsx';
import { SignatureBlock } from '../components/ui/SignatureBlock.tsx';
import { useDocument } from '../context/DocumentContext.tsx';

function fmt(n: number) { return n.toLocaleString('es-DO', { minimumFractionDigits: 2 }); }

export function ActaEntregaDoc() {
  const { fields, dispatch } = useDocument();
  const f = fields as AeFields;
  const set = (path: string, value: unknown) => dispatch({ type: 'SET_FIELD', path, value });

  // Auto-derive balance from totalContract - paid (mismo patrón que EC)
  useEffect(() => {
    const derived = (f.totalContract ?? 0) - (f.paid ?? 0);
    if (derived !== f.balance) set('balance', derived);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [f.totalContract, f.paid]);

  const setListItem = (key: 'executedWorks' | 'deliverables', i: number, v: string) => {
    const arr = [...f[key]]; arr[i] = v; set(key, arr);
  };

  return (
    <div className="doc on">
      <p className="hint">Haz clic en cualquier campo para editar</p>
      <DocHeader docType="Acta de Entrega" />

      <div className="cb">
        <div>
          <div className="lb">Contratante</div>
          <div className="cn"><EditableField value={f.clientName} onChange={(v) => set('clientName', v)} size={26} /></div>
          <div className="cs">Cédula: <EditableField value={f.clientCedula} onChange={(v) => set('clientCedula', v)} size={14} /></div>
        </div>
        <div>
          <div className="lb">Proyecto</div>
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
          <div className="lb">Inicio de obra</div>
          <div className="ov"><EditableField value={f.startDate} onChange={(v) => set('startDate', v)} /></div>
        </div>
        <div>
          <div className="lb">Fecha de entrega</div>
          <div className="ov"><EditableField value={f.deliveryDate} onChange={(v) => set('deliveryDate', v)} /></div>
        </div>
        <div>
          <div className="lb">Estado</div>
          <div style={{ marginTop: 6 }}>
            <span className="badge ba">Entrega conforme</span>
          </div>
        </div>
      </div>

      <div className="sd">Trabajos ejecutados</div>
      <ul className="ul">
        {f.executedWorks.map((w, i) => (
          <li key={i}><EditableField value={w} onChange={(v) => setListItem('executedWorks', i, v)} size={58} /></li>
        ))}
      </ul>
      <button className="add-row-btn" onClick={() => set('executedWorks', [...f.executedWorks, ''])}>+ AÑADIR</button>

      <div className="sd">Entregables al cliente</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 24px', fontSize: 12, marginBottom: 14 }}>
        {f.deliverables.map((d, i) => (
          <div key={i}>
            ☑ <EditableField value={d} onChange={(v) => setListItem('deliverables', i, v)} size={26} />
          </div>
        ))}
      </div>
      <button className="add-row-btn" onClick={() => set('deliverables', [...f.deliverables, ''])}>+ AÑADIR</button>

      <div className="sd">Saldo final liberado</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px 20px' }}>
        <div>
          <div className="lb">Total contrato</div>
          <div style={{ fontSize: 13, fontWeight: 700, marginTop: 3 }}>
            RD$ <EditableField value={String(f.totalContract)} onChange={(v) => set('totalContract', parseFloat(v) || 0)} numeric size={10} />
          </div>
        </div>
        <div>
          <div className="lb">Pagado a la fecha</div>
          <div style={{ fontSize: 13, fontWeight: 700, marginTop: 3 }}>
            RD$ <EditableField value={String(f.paid)} onChange={(v) => set('paid', parseFloat(v) || 0)} numeric size={10} />
          </div>
        </div>
        <div>
          <div className="lb">Saldo a liberar</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--accent)', marginTop: 3 }}>
            RD$ {fmt(f.balance)}
          </div>
        </div>
      </div>

      <div className="sd">Inicio del período de garantía</div>
      <div className="trm" style={{ marginTop: 0 }}>
        <EditableField value={f.warrantyText} onChange={(v) => set('warrantyText', v)} multiline />
      </div>

      <div className="sd">Observaciones del cliente</div>
      <div className="trm" style={{ minHeight: 50, marginTop: 0 }}>
        <EditableField value={f.clientObservations} onChange={(v) => set('clientObservations', v)} multiline />
      </div>

      <SignatureBlock signers={[{ label: 'Recibí conforme · Cliente' }, { label: 'Entregado · Kanan Remodelaciones' }]} />
      <DocFooter />
    </div>
  );
}
