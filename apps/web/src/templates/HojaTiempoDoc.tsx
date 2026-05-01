import { useEffect, useState, useRef } from 'react';
import type { HtFields } from '@kanan/shared';
import { DocHeader } from '../components/ui/DocHeader.tsx';
import { DocFooter } from '../components/ui/DocFooter.tsx';
import { EditableField } from '../components/ui/EditableField.tsx';
import { SignatureBlock } from '../components/ui/SignatureBlock.tsx';
import { useDocument } from '../context/DocumentContext.tsx';
import { api } from '../api/client.ts';

const DAYS = ['L', 'M', 'X', 'J', 'V', 'S'];

function fmt(n: number) { return n.toLocaleString('es-DO', { minimumFractionDigits: 2 }); }

interface StaffMember { _id: string; name: string; role: string; dailyRate: number }

/** Dropdown autocomplete for staff name in an HT row */
function StaffNameInput({
  value,
  staff,
  onChange,
  onSelect,
}: {
  value: string;
  staff: StaffMember[];
  onChange: (v: string) => void;
  onSelect: (s: StaffMember) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const matches = staff.filter(s =>
    s.name.toLowerCase().includes(value.toLowerCase()) && value.length > 0
  );

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-block' }}>
      <EditableField
        value={value}
        size={18}
        onChange={v => { onChange(v); setOpen(true); }}
      />
      {open && matches.length > 0 && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, zIndex: 100,
          background: '#1E1B17', border: '1px solid #2A2520',
          minWidth: 200, boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
        }}>
          {matches.map(s => (
            <div
              key={s._id}
              onMouseDown={() => { onSelect(s); setOpen(false); }}
              style={{
                padding: '7px 12px', cursor: 'pointer', fontSize: 11,
                fontFamily: "'IBM Plex Mono', monospace",
                color: '#E8DFCF', borderBottom: '1px solid #2A2520',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = '#252118')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <div>{s.name}</div>
              <div style={{ fontSize: 8, color: '#7A7068', marginTop: 2 }}>
                {s.role} · RD$ {s.dailyRate.toLocaleString('es-DO')} / día
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function HojaTiempoDoc() {
  const { fields, dispatch } = useDocument();
  const f = fields as HtFields;
  const set = (path: string, value: unknown) => dispatch({ type: 'SET_FIELD', path, value });

  const paymentStatus = f.paymentStatus ?? 'pendiente';

  // Load staff list for autocomplete
  const [staff, setStaff] = useState<StaffMember[]>([]);
  useEffect(() => {
    api.staff.list().then(d => setStaff(d as StaffMember[])).catch(() => {});
  }, []);

  // Auto-compute totals whenever rows change
  useEffect(() => {
    const totalDaysPerson = f.rows.reduce((s, r) => s + (r.totalDays ?? 0), 0);
    const totalPayroll = f.rows.reduce((s, r) => s + (r.total ?? 0), 0);
    set('totalDaysPerson', totalDaysPerson);
    set('totalPayroll', totalPayroll);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [f.rows]);

  return (
    <div className="doc on">
      <p className="hint">Haz clic en cualquier campo para editar</p>
      <DocHeader docType="Hoja de Tiempo Semanal" />

      <div className="ot2">
        <div>
          <div className="lb">Proyecto</div>
          <div className="ov"><EditableField value={f.projectName} onChange={(v) => set('projectName', v)} /></div>
        </div>
        <div>
          <div className="lb">Supervisor</div>
          <div className="ov"><EditableField value={f.supervisor} onChange={(v) => set('supervisor', v)} /></div>
        </div>
        <div>
          <div className="lb">Período</div>
          <div className="ov"><EditableField value={f.period} onChange={(v) => set('period', v)} /></div>
        </div>
        <div>
          <div className="lb">Estado</div>
          <div style={{ marginTop: 6 }}>
            <select
              value={paymentStatus}
              onChange={(e) => set('paymentStatus', e.target.value)}
              className={paymentStatus === 'pendiente' ? 'badge bp' : 'badge bd'}
              style={{ font: 'inherit', fontSize: 11, background: 'transparent', border: 'none', cursor: 'pointer', padding: '2px 8px' }}
            >
              <option value="pendiente">Pendiente de pago</option>
              <option value="hecho">Pagado</option>
            </select>
          </div>
        </div>
      </div>

      <div className="sd">Asistencia · Días trabajados</div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ tableLayout: 'auto', fontSize: 11 }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left' }}>Personal</th>
              {DAYS.map((d, i) => <th key={i} className="r">{d}</th>)}
              <th className="r">Días</th>
              <th className="r">Tarifa</th>
              <th className="r">Total RD$</th>
              <th style={{ width: 24 }} />
            </tr>
          </thead>
          <tbody>
            {f.rows.map((row, i) => {
              const updateRow = (key: string, v: unknown) => {
                const rows = f.rows.map((r, j) => {
                  if (j !== i) return r;
                  const next = { ...r, [key]: v };
                  if (key === 'days' || key === 'dailyRate') {
                    const days = (Array.isArray(key === 'days' ? v : r.days) ? (key === 'days' ? v : r.days) : r.days) as (number | null)[];
                    next.totalDays = days.reduce<number>((acc, d) => acc + (d ?? 0), 0);
                    next.total = next.totalDays * (key === 'dailyRate' ? (parseFloat(String(v)) || 0) : r.dailyRate);
                  }
                  return next;
                });
                set('rows', rows);
              };
              const setDay = (d: number, v: string) => {
                const days = [...row.days];
                days[d] = v === '' ? null : parseFloat(v) || 0;
                updateRow('days', days);
              };
              const selectStaff = (s: StaffMember) => {
                const rows = f.rows.map((r, j) => {
                  if (j !== i) return r;
                  const next = { ...r, name: s.name, role: s.role, dailyRate: s.dailyRate };
                  next.total = (next.totalDays ?? 0) * s.dailyRate;
                  return next;
                });
                set('rows', rows);
              };
              return (
                <tr key={i}>
                  <td>
                    <StaffNameInput
                      value={row.name}
                      staff={staff}
                      onChange={v => updateRow('name', v)}
                      onSelect={selectStaff}
                    />
                    <br />
                    <span style={{ color: 'var(--p)' }}>
                      <EditableField value={row.role} onChange={(v) => updateRow('role', v)} size={14} />
                    </span>
                  </td>
                  {DAYS.map((_, d) => (
                    <td key={d} className="r">
                      <EditableField value={row.days[d] !== null && row.days[d] !== undefined ? String(row.days[d]) : ''} onChange={(v) => setDay(d, v)} numeric size={3} />
                    </td>
                  ))}
                  <td className="r">{row.totalDays}</td>
                  <td className="r"><EditableField value={String(row.dailyRate)} onChange={(v) => updateRow('dailyRate', parseFloat(v) || 0)} numeric size={8} /></td>
                  <td className="r">{fmt(row.total)}</td>
                  <td><span className="row-actions"><button className="row-del" onClick={() => set('rows', f.rows.filter((_, j) => j !== i))}>×</button></span></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <button className="add-row-btn" onClick={() => set('rows', [...f.rows, { name: '', role: '', days: [null, null, null, null, null, null], totalDays: 0, dailyRate: 0, total: 0 }])}>+ PERSONAL</button>

      <div className="tot">
        <div className="ti">
          <div className="tl">TOTAL DÍAS-PERSONA</div>
          <div className="tv">{f.totalDaysPerson}</div>
        </div>
        <div className="ti g">
          <div className="tl">TOTAL NÓMINA RD$</div>
          <div className="tv">RD$ {fmt(f.totalPayroll)}</div>
        </div>
      </div>

      <div className="sd">Observaciones</div>
      <div className="trm" style={{ minHeight: 40, marginTop: 0 }}>
        <EditableField value={f.observations} onChange={(v) => set('observations', v)} multiline />
      </div>

      <div className="sd">Forma de pago</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px 20px' }}>
        <div>
          <div className="lb">Método</div>
          <div style={{ fontSize: 13, fontWeight: 700, marginTop: 3 }}>
            <EditableField value={f.paymentMethod} onChange={(v) => set('paymentMethod', v)} size={18} />
          </div>
        </div>
        <div>
          <div className="lb">Fecha de pago</div>
          <div style={{ fontSize: 13, fontWeight: 700, marginTop: 3 }}>
            <EditableField value={f.paymentDate} onChange={(v) => set('paymentDate', v)} size={18} />
          </div>
        </div>
        <div>
          <div className="lb">Hora entrega</div>
          <div style={{ fontSize: 13, fontWeight: 700, marginTop: 3 }}>
            <EditableField value={f.paymentTime} onChange={(v) => set('paymentTime', v)} size={14} />
          </div>
        </div>
      </div>

      <SignatureBlock signers={[{ label: 'Supervisor · Reporta' }, { label: 'Director · Autoriza pago' }]} />
      <DocFooter />
    </div>
  );
}
