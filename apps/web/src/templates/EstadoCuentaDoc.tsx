import { useEffect } from 'react';
import type { EcFields } from '@kanan/shared';
import { DocHeader } from '../components/ui/DocHeader.tsx';
import { DocFooter } from '../components/ui/DocFooter.tsx';
import { EditableField } from '../components/ui/EditableField.tsx';
import { useDocument } from '../context/DocumentContext.tsx';

function fmt(n: number | null) {
  if (n === null) return '—';
  return n.toLocaleString('es-DO', { minimumFractionDigits: 2 });
}

export function EstadoCuentaDoc() {
  const { fields, dispatch } = useDocument();
  const f = fields as EcFields;
  const set = (path: string, value: unknown) => dispatch({ type: 'SET_FIELD', path, value });

  // Auto-compute running balances whenever charge/credit values change
  useEffect(() => {
    let running = 0;
    const updated = f.movements.map((m) => {
      running = running + (m.charge ?? 0) - (m.credit ?? 0);
      return { ...m, balance: running };
    });
    const changed = updated.some((m, i) => m.balance !== f.movements[i]?.balance);
    if (changed) set('movements', updated);
  // Serialize deps to avoid object-identity loop
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [f.movements.map((m) => `${m.charge ?? ''}|${m.credit ?? ''}`).join(',')]);

  const totalCargos = f.movements.reduce((s, m) => s + (m.charge ?? 0), 0);
  const totalAbonos = f.movements.reduce((s, m) => s + (m.credit ?? 0), 0);
  const saldo = f.totalContracted - f.totalPaid;

  return (
    <div className="doc on">
      <p className="hint">Haz clic en cualquier campo para editar</p>
      <DocHeader docType="Estado de Cuenta" />

      <div className="cb">
        <div>
          <div className="lb">Cliente</div>
          <div className="cn"><EditableField value={f.clientName} onChange={(v) => set('clientName', v)} size={26} /></div>
          <div className="cs">Cédula: <EditableField value={f.clientCedula} onChange={(v) => set('clientCedula', v)} size={14} /></div>
        </div>
        <div>
          <div className="lb">Proyecto</div>
          <div className="cn" style={{ fontSize: 12 }}><EditableField value={f.projectName} onChange={(v) => set('projectName', v)} size={24} /></div>
          <div className="cs" style={{ marginTop: 4 }}>Ref: <EditableField value={f.sowRef} onChange={(v) => set('sowRef', v)} size={16} /></div>
        </div>
      </div>

      <div className="ot2">
        <div>
          <div className="lb">Total contratado</div>
          <div className="ov">RD$ <EditableField value={String(f.totalContracted)} onChange={(v) => set('totalContracted', parseFloat(v) || 0)} numeric size={14} /></div>
        </div>
        <div>
          <div className="lb">Pagado a la fecha</div>
          <div className="ov">RD$ <EditableField value={String(f.totalPaid)} onChange={(v) => set('totalPaid', parseFloat(v) || 0)} numeric size={14} /></div>
        </div>
        <div>
          <div className="lb">Saldo pendiente</div>
          <div className="ov">RD$ {fmt(saldo)}</div>
        </div>
        <div>
          <div className="lb">Próximo vencimiento</div>
          <div className="ov"><EditableField value={f.nextDueDate} onChange={(v) => set('nextDueDate', v)} /></div>
        </div>
      </div>

      <div className="sd">Movimientos del proyecto</div>
      <table>
        <thead>
          <tr>
            <th style={{ width: 90 }}>Fecha</th>
            <th>Concepto</th>
            <th>Documento</th>
            <th className="r">Cargo</th>
            <th className="r">Abono</th>
            <th className="r">Saldo</th>
            <th style={{ width: 24 }} />
          </tr>
        </thead>
        <tbody>
          {f.movements.map((m, i) => {
            const update = (key: string, v: unknown) => {
              const arr = f.movements.map((x, j) => j === i ? { ...x, [key]: v } : x);
              set('movements', arr);
            };
            return (
              <tr key={i}>
                <td className="sm"><EditableField value={m.date} onChange={(v) => update('date', v)} size={12} /></td>
                <td><EditableField value={m.concept} onChange={(v) => update('concept', v)} size={20} /></td>
                <td className="sm"><EditableField value={m.document} onChange={(v) => update('document', v)} size={14} /></td>
                <td className="r"><EditableField value={m.charge !== null ? String(m.charge) : ''} onChange={(v) => update('charge', v === '' ? null : parseFloat(v) || 0)} numeric size={10} /></td>
                <td className="r sm"><EditableField value={m.credit !== null ? String(m.credit) : ''} onChange={(v) => update('credit', v === '' ? null : parseFloat(v) || 0)} numeric size={10} /></td>
                <td className="r">{fmt(m.balance)}</td>
                <td><span className="row-actions"><button className="row-del" onClick={() => set('movements', f.movements.filter((_, j) => j !== i))}>×</button></span></td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <button className="add-row-btn" onClick={() => set('movements', [...f.movements, { date: '', concept: '', document: '', charge: null, credit: null, balance: 0 }])}>+ MOVIMIENTO</button>

      <div className="tot">
        <div className="ti"><div className="tl">TOTAL CARGOS</div><div className="tv">RD$ {fmt(totalCargos)}</div></div>
        <div className="ti"><div className="tl">TOTAL ABONOS</div><div className="tv">RD$ {fmt(totalAbonos)}</div></div>
        <div className="ti g"><div className="tl">SALDO RD$</div><div className="tv">RD$ {fmt(saldo)}</div></div>
      </div>

      <div className="sd">Próximo cobro</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px 20px' }}>
        <div>
          <div className="lb">Concepto</div>
          <div style={{ fontSize: 13, fontWeight: 700, marginTop: 3 }}>
            <EditableField value={f.nextCharge.concept} onChange={(v) => set('nextCharge', { ...f.nextCharge, concept: v })} size={22} />
          </div>
        </div>
        <div>
          <div className="lb">Monto</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent)', marginTop: 3 }}>
            RD$ <EditableField value={String(f.nextCharge.amount)} onChange={(v) => set('nextCharge', { ...f.nextCharge, amount: parseFloat(v) || 0 })} numeric size={12} />
          </div>
        </div>
        <div>
          <div className="lb">Vencimiento</div>
          <div style={{ fontSize: 13, fontWeight: 700, marginTop: 3 }}>
            <EditableField value={f.nextCharge.dueDate} onChange={(v) => set('nextCharge', { ...f.nextCharge, dueDate: v })} size={16} />
          </div>
        </div>
      </div>

      <div className="trm" style={{ marginTop: 14 }}>
        <EditableField value={f.paymentNote} onChange={(v) => set('paymentNote', v)} multiline placeholder="Nota de próximo pago" />
      </div>

      <DocFooter />
    </div>
  );
}
