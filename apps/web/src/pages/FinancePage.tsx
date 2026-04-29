import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { api } from '../api/client.ts';
import type { CompanyFinancialSummary, ProjectFinancialRow } from '@kanan/shared';

const T = {
  surface: '#1A1714',
  card:    '#1E1B17',
  cardHov: '#252118',
  border:  '#2A2520',
  text:    '#E8DFCF',
  muted:   '#7A7068',
  dim:     '#4A4540',
  accent:  '#B95D34',
  green:   '#7A8C47',
  yellow:  '#C9AA71',
  red:     '#C4673A',
} as const;

const STATUS_CFG: Record<string, { text: string; label: string }> = {
  cotizando:  { text: '#C9AA71', label: 'Cotizando'  },
  activo:     { text: '#7A8C47', label: 'Activo'     },
  completado: { text: '#9CAA72', label: 'Completado' },
  garantia:   { text: '#C4673A', label: 'Garantía'   },
};

function fmt(n: number) {
  if (n === 0) return '—';
  return new Intl.NumberFormat('es-DO', { style: 'currency', currency: 'DOP', maximumFractionDigits: 0 }).format(n);
}

function pct(n: number) {
  if (n === 0) return '—';
  return `${n > 0 ? '+' : ''}${n.toFixed(1)}%`;
}

const STYLES = `
@keyframes kFadeUp { from { opacity:0;transform:translateY(6px); } to { opacity:1;transform:translateY(0); } }
.k-in { animation: kFadeUp 0.28s ease both; }
`;

interface SummaryCardProps { label: string; value: string; sub?: string; color?: string; delay: number }
function SummaryCard({ label, value, sub, color = T.text, delay }: SummaryCardProps) {
  return (
    <div className="k-in" style={{ background: T.card, border: `1px solid ${T.border}`, padding: '18px 20px', animationDelay: `${delay}ms` }}>
      <div style={{ fontSize: 8, letterSpacing: '0.2em', textTransform: 'uppercase', color: T.muted, marginBottom: 10 }}>{label}</div>
      <div style={{ fontSize: 22, fontFamily: 'Fraunces, serif', fontStyle: 'italic', color, lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 9, color: T.dim, marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

function ProjectRow({ row }: { row: ProjectFinancialRow }) {
  const [open, setOpen] = useState(false);
  const cfg = STATUS_CFG[row.status] ?? { text: T.muted, label: row.status };
  const margenColor = row.margenPct > 20 ? T.green : row.margenPct > 0 ? T.yellow : T.red;

  return (
    <>
      <tr
        onClick={() => setOpen(o => !o)}
        style={{ cursor: 'pointer', borderBottom: `1px solid ${T.border}` }}
        onMouseEnter={e => (e.currentTarget.style.background = T.cardHov)}
        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
      >
        <td style={{ padding: '11px 14px', width: 20 }}>
          {open ? <ChevronDown size={11} color={T.dim} /> : <ChevronRight size={11} color={T.dim} />}
        </td>
        <td style={{ padding: '11px 8px' }}>
          <div style={{ fontSize: 11, color: T.text }}>{row.projectName}</div>
          <div style={{ fontSize: 9, color: T.muted, marginTop: 2 }}>{row.clientName}</div>
        </td>
        <td style={{ padding: '11px 8px' }}>
          <span style={{ fontSize: 7, letterSpacing: '0.14em', textTransform: 'uppercase', color: cfg.text, padding: '2px 7px', border: `1px solid ${cfg.text}30` }}>
            {cfg.label}
          </span>
        </td>
        <td style={{ padding: '11px 8px', textAlign: 'right', fontSize: 11, color: T.muted }}>{fmt(row.contratado)}</td>
        <td style={{ padding: '11px 8px', textAlign: 'right', fontSize: 11, color: T.text }}>{fmt(row.cobrado)}</td>
        <td style={{ padding: '11px 8px', textAlign: 'right', fontSize: 11, color: row.saldoPendiente > 0 ? T.yellow : T.dim }}>{fmt(row.saldoPendiente)}</td>
        <td style={{ padding: '11px 8px', textAlign: 'right', fontSize: 11, color: T.muted }}>{fmt(row.costoMateriales + row.costoNomina)}</td>
        <td style={{ padding: '11px 14px', textAlign: 'right', fontSize: 11, fontWeight: 600, color: margenColor }}>{pct(row.margenPct)}</td>
      </tr>
      {open && (
        <tr style={{ background: T.surface }}>
          <td />
          <td colSpan={7} style={{ padding: '12px 8px 14px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
              {[
                { label: 'Contratado (COT)', value: fmt(row.contratado) },
                { label: 'Facturado (FAC)',  value: fmt(row.facturado)  },
                { label: 'Cobrado (REC)',    value: fmt(row.cobrado)    },
                { label: 'Órdenes extra (OC)', value: fmt(row.ordenesExtra)    },
                { label: 'Materiales (RM)', value: fmt(row.costoMateriales)   },
                { label: 'Nómina (HT)',     value: fmt(row.costoNomina)       },
              ].map(item => (
                <div key={item.label} style={{ fontSize: 9 }}>
                  <div style={{ color: T.dim, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 3 }}>{item.label}</div>
                  <div style={{ color: T.text }}>{item.value}</div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 12 }}>
              <Link
                to={`/projects/${row.projectId}`}
                style={{ fontSize: 9, color: T.accent, textDecoration: 'none', letterSpacing: '0.1em' }}
                onClick={e => e.stopPropagation()}
              >
                Ver proyecto →
              </Link>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

export function FinancePage() {
  const [data, setData] = useState<CompanyFinancialSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState<'cobrado' | 'margenPct' | 'saldoPendiente'>('cobrado');

  useEffect(() => {
    api.finance.summary()
      .then(d => setData(d as CompanyFinancialSummary))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const sorted = data
    ? [...data.byProject].sort((a, b) => b[sort] - a[sort])
    : [];

  const thStyle = (key: typeof sort): React.CSSProperties => ({
    padding: '8px', textAlign: 'right', fontSize: 7, letterSpacing: '0.16em',
    textTransform: 'uppercase', cursor: 'pointer', userSelect: 'none',
    color: sort === key ? T.text : T.dim,
    borderBottom: `2px solid ${sort === key ? T.accent : 'transparent'}`,
    transition: 'color 0.12s',
  });

  return (
    <>
      <style>{STYLES}</style>
      <div style={{ padding: '52px 48px 80px', color: T.text, fontFamily: "'IBM Plex Mono', monospace", maxWidth: 1200 }}>

        {/* Header */}
        <div className="k-in" style={{ marginBottom: 36 }}>
          <p style={{ fontSize: 8, letterSpacing: '0.26em', textTransform: 'uppercase', color: T.dim, margin: '0 0 10px' }}>Inteligencia financiera</p>
          <h1 style={{ fontFamily: 'Fraunces, serif', fontStyle: 'italic', fontSize: 'clamp(36px, 4vw, 52px)', fontWeight: 400, color: T.text, lineHeight: 1.0, margin: 0 }}>
            Finanzas
          </h1>
        </div>

        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
            {[...Array(4)].map((_, i) => <div key={i} style={{ height: 80, background: T.surface, border: `1px solid ${T.border}`, opacity: 0.4 }} />)}
          </div>
        ) : data && (
          <>
            {/* Summary cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 40 }}>
              <SummaryCard label="Total contratado"  value={fmt(data.contratado)}      sub="desde cotizaciones"    color={T.muted}  delay={40}  />
              <SummaryCard label="Total facturado"   value={fmt(data.facturado)}        sub="suma de facturas"      color={T.text}   delay={70}  />
              <SummaryCard label="Total cobrado"     value={fmt(data.cobrado)}          sub="suma de recibos"       color={T.green}  delay={100} />
              <SummaryCard
                label="Saldo por cobrar"
                value={fmt(data.saldoPendiente)}
                sub="facturado − cobrado"
                color={data.saldoPendiente > 0 ? T.yellow : T.dim}
                delay={130}
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 48 }}>
              <SummaryCard label="Costo materiales" value={fmt(data.costoMateriales)} sub="desde requisiciones"   color={T.muted}  delay={160} />
              <SummaryCard label="Costo nómina"     value={fmt(data.costoNomina)}     sub="desde hojas de tiempo" color={T.muted}  delay={190} />
            </div>

            {/* Per-project table */}
            <div className="k-in" style={{ animationDelay: '200ms' }}>
              <p style={{ fontSize: 8, letterSpacing: '0.22em', textTransform: 'uppercase', color: T.muted, margin: '0 0 14px' }}>
                P&L por proyecto · {sorted.length}
              </p>
              {sorted.length === 0 ? (
                <p style={{ fontSize: 11, color: T.dim }}>Sin proyectos con datos financieros.</p>
              ) : (
                <div style={{ border: `1px solid ${T.border}`, overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: `1px solid ${T.border}`, background: T.surface }}>
                        <th style={{ width: 32 }} />
                        <th style={{ padding: '8px', textAlign: 'left', fontSize: 7, letterSpacing: '0.16em', textTransform: 'uppercase', color: T.dim }}>Proyecto</th>
                        <th style={{ padding: '8px', textAlign: 'left', fontSize: 7, letterSpacing: '0.16em', textTransform: 'uppercase', color: T.dim }}>Estado</th>
                        <th style={{ padding: '8px', textAlign: 'right', fontSize: 7, letterSpacing: '0.16em', textTransform: 'uppercase', color: T.dim }}>Contratado</th>
                        <th style={{ ...thStyle('cobrado'), paddingRight: 8 }} onClick={() => setSort('cobrado')}>Cobrado ↕</th>
                        <th style={{ ...thStyle('saldoPendiente'), paddingRight: 8 }} onClick={() => setSort('saldoPendiente')}>Saldo ↕</th>
                        <th style={{ padding: '8px', textAlign: 'right', fontSize: 7, letterSpacing: '0.16em', textTransform: 'uppercase', color: T.dim }}>Costos</th>
                        <th style={{ ...thStyle('margenPct'), paddingRight: 14 }} onClick={() => setSort('margenPct')}>Margen ↕</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sorted.map(row => <ProjectRow key={row.projectId} row={row} />)}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
}
