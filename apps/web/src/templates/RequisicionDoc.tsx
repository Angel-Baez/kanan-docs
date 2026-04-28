import type { RmFields } from '@kanan/shared';
import { useEffect } from 'react';
import { DocHeader } from '../components/ui/DocHeader.tsx';
import { DocFooter } from '../components/ui/DocFooter.tsx';
import { EditableField } from '../components/ui/EditableField.tsx';
import { SignatureBlock } from '../components/ui/SignatureBlock.tsx';
import { useDocument } from '../context/DocumentContext.tsx';

function fmt(n: number) { return n.toLocaleString('es-DO', { minimumFractionDigits: 2 }); }

export function RequisicionDoc() {
  const { fields, dispatch } = useDocument();
  const f = fields as RmFields;
  const set = (path: string, value: unknown) => dispatch({ type: 'SET_FIELD', path, value });

  useEffect(() => {
    const subtotal = f.items.reduce((acc, it) => acc + it.subtotal, 0);
    const itbis = Math.round(subtotal * 18) / 100;
    set('subtotal', subtotal);
    set('itbis', itbis);
    set('total', subtotal + itbis);
    set('thisRequisition', subtotal + itbis);
    set('remainingMargin', f.authorizedBudget - (subtotal + itbis));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(f.items), f.authorizedBudget]);

  const updateItem = (i: number, key: string, value: unknown) => {
    const items = f.items.map((it, j) => {
      if (j !== i) return it;
      const next = { ...it, [key]: value };
      if (key === 'qty' || key === 'refPrice') {
        next.subtotal = Number(next.qty) * Number(next.refPrice);
      }
      return next;
    });
    set('items', items);
  };

  return (
    <div className="doc on">
      <p className="hint">Haz clic en cualquier campo para editar</p>
      <DocHeader docType="Requisición de Materiales" />

      <div className="cb">
        <div>
          <div className="lb">Solicitar a</div>
          <div className="cn"><EditableField value={f.supplierName} onChange={(v) => set('supplierName', v)} size={24} /></div>
          <div className="cs">
            <EditableField value={f.supplierAddress} onChange={(v) => set('supplierAddress', v)} size={26} />
            <br />Atn: <EditableField value={f.supplierContact} onChange={(v) => set('supplierContact', v)} size={20} />
          </div>
        </div>
        <div>
          <div className="lb">Solicitado por</div>
          <div className="cn" style={{ fontSize: 12 }}><EditableField value={f.requestedBy} onChange={(v) => set('requestedBy', v)} size={22} /></div>
          <div className="cs" style={{ marginTop: 4 }}>Autorizado: <EditableField value={f.authorizedBy} onChange={(v) => set('authorizedBy', v)} size={18} /></div>
        </div>
      </div>

      <div className="ot2">
        <div>
          <div className="lb">Ref. Orden de Trabajo (OT)</div>
          <div className="ov"><EditableField value={f.otRef} onChange={(v) => set('otRef', v)} /></div>
        </div>
        <div>
          <div className="lb">Proyecto / Referencia</div>
          <div className="ov"><EditableField value={f.projectName} onChange={(v) => set('projectName', v)} /></div>
        </div>
        <div>
          <div className="lb">Urgencia</div>
          <div className="ov"><EditableField value={f.urgency} onChange={(v) => set('urgency', v)} /></div>
        </div>
        <div>
          <div className="lb">Forma de entrega</div>
          <div className="ov"><EditableField value={f.deliveryMethod} onChange={(v) => set('deliveryMethod', v)} /></div>
        </div>
        <div>
          <div className="lb">Forma de pago</div>
          <div className="ov"><EditableField value={f.paymentTerms} onChange={(v) => set('paymentTerms', v)} /></div>
        </div>
      </div>

      <div className="sd">Materiales requeridos</div>
      <table>
        <thead>
          <tr>
            <th style={{ width: 30 }}>#</th>
            <th>Descripción</th>
            <th>Especificación</th>
            <th className="r">Und</th>
            <th className="r">Cant.</th>
            <th className="r">P. Ref.</th>
            <th className="r">Subtotal</th>
            <th style={{ width: 24 }} />
          </tr>
        </thead>
        <tbody>
          {f.items.map((item, i) => (
            <tr key={i}>
              <td className="sm">{String(i + 1).padStart(2, '0')}</td>
              <td><EditableField value={item.description} onChange={(v) => updateItem(i, 'description', v)} size={18} /></td>
              <td className="sm"><EditableField value={item.spec} onChange={(v) => updateItem(i, 'spec', v)} size={14} /></td>
              <td className="r sm"><EditableField value={item.unit} onChange={(v) => updateItem(i, 'unit', v)} size={6} /></td>
              <td className="r"><EditableField value={String(item.qty)} onChange={(v) => updateItem(i, 'qty', parseFloat(v) || 0)} numeric size={6} /></td>
              <td className="r sm"><EditableField value={String(item.refPrice)} onChange={(v) => updateItem(i, 'refPrice', parseFloat(v) || 0)} numeric size={10} /></td>
              <td className="r">{fmt(item.subtotal)}</td>
              <td><span className="row-actions"><button className="row-del" onClick={() => set('items', f.items.filter((_, j) => j !== i))}>×</button></span></td>
            </tr>
          ))}
        </tbody>
      </table>
      <button className="add-row-btn" onClick={() => set('items', [...f.items, { number: f.items.length + 1, description: '', spec: '', unit: '', qty: 1, refPrice: 0, subtotal: 0 }])}>+ ÍTEM</button>

      <div className="tot">
        <div className="ti"><div className="tl">SUBTOTAL</div><div className="tv">RD$ {fmt(f.subtotal)}</div></div>
        <div className="ti"><div className="tl">ITBIS 18%</div><div className="tv">RD$ {fmt(f.itbis)}</div></div>
        <div className="ti g"><div className="tl">TOTAL RD$</div><div className="tv">RD$ {fmt(f.total)}</div></div>
      </div>

      <div className="sd">Especificaciones de despacho</div>
      <div className="trm" style={{ marginTop: 0 }}>
        <EditableField value={f.dispatchInstructions} onChange={(v) => set('dispatchInstructions', v)} multiline />
      </div>

      <div className="sd">Presupuesto autorizado</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px 20px' }}>
        <div>
          <div className="lb">Tope autorizado</div>
          <div style={{ fontSize: 13, fontWeight: 700, marginTop: 3 }}>
            RD$ <EditableField value={String(f.authorizedBudget)} onChange={(v) => set('authorizedBudget', parseFloat(v) || 0)} numeric size={10} />
          </div>
        </div>
        <div>
          <div className="lb">Esta requisición</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent)', marginTop: 3 }}>
            RD$ {fmt(f.thisRequisition)}
          </div>
        </div>
        <div>
          <div className="lb">Margen restante</div>
          <div style={{ fontSize: 13, fontWeight: 700, marginTop: 3 }}>
            RD$ {fmt(f.remainingMargin)}
          </div>
        </div>
      </div>

      <SignatureBlock signers={[{ label: 'Solicitado · Maestro de obra' }, { label: 'Autorizado · Director Operaciones' }]} />
      <DocFooter />
    </div>
  );
}
