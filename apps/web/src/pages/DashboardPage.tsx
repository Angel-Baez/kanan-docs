import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, TrendingUp, Clock, AlertCircle, CheckCircle2 } from 'lucide-react';
import { api } from '../api/client.ts';
import { TEMPLATE_META } from '../templates/registry.ts';
import { KpiSkeleton, RowSkeleton } from '../components/ui/Skeleton.tsx';
import type { KananProject } from '@kanan/shared';

const T = {
  bg:      '#0F0D0B',
  surface: '#1A1714',
  card:    '#1E1B17',
  cardHov: '#252118',
  border:  '#2A2520',
  text:    '#E8DFCF',
  muted:   '#7A7068',
  dim:     '#4A4540',
  accent:  '#B95D34',
} as const;

const STATUS_CFG: Record<string, { text: string; bg: string; border: string; label: string }> = {
  cotizando:  { text: '#C9AA71', bg: '#C9AA7112', border: '#C9AA7130', label: 'Cotizando'  },
  activo:     { text: '#7A8C47', bg: '#7A8C4712', border: '#7A8C4730', label: 'Activo'     },
  completado: { text: '#9CAA72', bg: '#9CAA7212', border: '#9CAA7230', label: 'Completado' },
  garantia:   { text: '#C4673A', bg: '#C4673A12', border: '#C4673A30', label: 'Garantía'   },
};

function fmt(n: number) {
  return new Intl.NumberFormat('es-DO', { style: 'currency', currency: 'DOP', maximumFractionDigits: 0 }).format(n);
}

function formatDate(iso?: string) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('es-DO', { day: '2-digit', month: 'short' });
}

interface Summary {
  activeProjects: number;
  cotizando: number;
  ingresosMes: number;
  facturasPendientes: number;
  recentDocs: Array<{
    _id: string;
    templateId: string;
    title: string;
    updatedAt: string;
    projectId?: { _id: string; name: string; clientId: string } | string;
  }>;
  activeProjectList: Array<KananProject & { clientId: { _id: string; name: string } | string }>;
}

interface KpiCardProps {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ReactNode;
  color: string;
  delay: number;
}

function KpiCard({ label, value, sub, icon, color, delay }: KpiCardProps) {
  return (
    <div className="k-in" style={{
      background: T.card,
      border: `1px solid ${T.border}`,
      padding: '20px 22px',
      display: 'flex',
      flexDirection: 'column',
      gap: 12,
      animationDelay: `${delay}ms`,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 8, letterSpacing: '0.2em', textTransform: 'uppercase', color: T.muted }}>
          {label}
        </span>
        <span style={{ color, opacity: 0.7 }}>{icon}</span>
      </div>
      <div>
        <div style={{ fontSize: 28, fontFamily: 'Fraunces, serif', fontStyle: 'italic', color: T.text, lineHeight: 1 }}>
          {value}
        </div>
        {sub && <div style={{ fontSize: 9, color: T.dim, marginTop: 4, letterSpacing: '0.06em' }}>{sub}</div>}
      </div>
    </div>
  );
}

const STYLES = `
@keyframes kFadeUp {
  from { opacity: 0; transform: translateY(6px); }
  to   { opacity: 1; transform: translateY(0); }
}
.k-in { animation: kFadeUp 0.28s ease both; }
`;

export function DashboardPage() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.dashboard.summary()
      .then(s => setSummary(s as Summary))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const clientName = (doc: Summary['recentDocs'][number]) => {
    if (!doc.projectId || typeof doc.projectId === 'string') return null;
    return doc.projectId;
  };

  return (
    <>
      <style>{STYLES}</style>
      <div style={{ padding: '52px 48px 80px', color: T.text, fontFamily: "'IBM Plex Mono', monospace", maxWidth: 1100 }}>

        {/* Header */}
        <div className="k-in" style={{ marginBottom: 36, animationDelay: '0ms' }}>
          <p style={{ fontSize: 8, letterSpacing: '0.26em', textTransform: 'uppercase', color: T.dim, margin: '0 0 10px' }}>
            Sistema Operativo Interno
          </p>
          <h1 style={{
            fontFamily: 'Fraunces, serif', fontStyle: 'italic',
            fontSize: 'clamp(36px, 4vw, 52px)', fontWeight: 400,
            color: T.text, lineHeight: 1.0, margin: 0,
          }}>
            Dashboard
          </h1>
        </div>

        {loading ? (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 40 }}>
              {[...Array(4)].map((_, i) => <KpiSkeleton key={i} />)}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {[...Array(5)].map((_, i) => <RowSkeleton key={i} cols={2} />)}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {[...Array(8)].map((_, i) => <RowSkeleton key={i} cols={3} />)}
              </div>
            </div>
          </>
        ) : summary && (
          <>
            {/* KPI row */}
            <div className="k-in" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 40, animationDelay: '40ms' }}>
              <KpiCard
                label="Proyectos activos"
                value={summary.activeProjects}
                icon={<CheckCircle2 size={14} />}
                color="#7A8C47"
                delay={60}
              />
              <KpiCard
                label="En cotización"
                value={summary.cotizando}
                icon={<Clock size={14} />}
                color="#C9AA71"
                delay={90}
              />
              <KpiCard
                label="Ingresos este mes"
                value={fmt(summary.ingresosMes)}
                sub="desde recibos de pago"
                icon={<TrendingUp size={14} />}
                color="#B95D34"
                delay={120}
              />
              <KpiCard
                label="Facturas pendientes"
                value={summary.facturasPendientes}
                sub="sin cobrar"
                icon={<AlertCircle size={14} />}
                color="#C4673A"
                delay={150}
              />
            </div>

            {/* Two-column: active projects + recent docs */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}>

              {/* Active projects */}
              <div className="k-in" style={{ animationDelay: '180ms' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                  <p style={{ fontSize: 8, letterSpacing: '0.22em', textTransform: 'uppercase', color: T.muted, margin: 0 }}>
                    Proyectos activos
                  </p>
                  <Link to="/projects" style={{ fontSize: 8, color: T.dim, textDecoration: 'none', letterSpacing: '0.1em', display: 'flex', alignItems: 'center', gap: 4, transition: 'color 0.12s' }}
                    onMouseEnter={e => (e.currentTarget.style.color = T.text)}
                    onMouseLeave={e => (e.currentTarget.style.color = T.dim)}
                  >
                    Ver todos <ArrowRight size={10} />
                  </Link>
                </div>
                {summary.activeProjectList.length === 0 ? (
                  <p style={{ fontSize: 11, color: T.dim }}>Sin proyectos activos.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {summary.activeProjectList.map((proj, i) => {
                      const cfg = STATUS_CFG[proj.status] ?? STATUS_CFG['activo']!;
                      const clientDisplayName = typeof proj.clientId === 'object' && proj.clientId !== null
                        ? (proj.clientId as { name: string }).name
                        : '';
                      return (
                        <Link
                          key={proj._id as string}
                          to={`/projects/${proj._id}`}
                          className="k-in"
                          style={{
                            display: 'flex', alignItems: 'center', gap: 10,
                            padding: '10px 12px',
                            background: T.card,
                            borderLeft: `2px solid ${cfg.text}`,
                            textDecoration: 'none',
                            transition: 'background 0.12s',
                            animationDelay: `${200 + i * 20}ms`,
                          }}
                          onMouseEnter={e => (e.currentTarget.style.background = T.cardHov)}
                          onMouseLeave={e => (e.currentTarget.style.background = T.card)}
                        >
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 11, color: T.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {proj.name}
                            </div>
                            {clientDisplayName && (
                              <div style={{ fontSize: 9, color: T.muted, marginTop: 2 }}>{clientDisplayName}</div>
                            )}
                          </div>
                          {proj.totalAmount != null && (
                            <span style={{ fontSize: 9, color: T.dim, flexShrink: 0 }}>
                              {fmt(proj.totalAmount)}
                            </span>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Recent activity */}
              <div className="k-in" style={{ animationDelay: '200ms' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                  <p style={{ fontSize: 8, letterSpacing: '0.22em', textTransform: 'uppercase', color: T.muted, margin: 0 }}>
                    Actividad reciente
                  </p>
                  <Link to="/documents" style={{ fontSize: 8, color: T.dim, textDecoration: 'none', letterSpacing: '0.1em', display: 'flex', alignItems: 'center', gap: 4, transition: 'color 0.12s' }}
                    onMouseEnter={e => (e.currentTarget.style.color = T.text)}
                    onMouseLeave={e => (e.currentTarget.style.color = T.dim)}
                  >
                    Ver todos <ArrowRight size={10} />
                  </Link>
                </div>
                {summary.recentDocs.length === 0 ? (
                  <p style={{ fontSize: 11, color: T.dim }}>Sin documentos.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {summary.recentDocs.map((doc, i) => {
                      const meta = TEMPLATE_META[doc.templateId as keyof typeof TEMPLATE_META];
                      const proj = clientName(doc);
                      return (
                        <Link
                          key={doc._id}
                          to={`/documents/${doc._id}`}
                          className="k-in"
                          style={{
                            display: 'flex', alignItems: 'center', gap: 10,
                            padding: '10px 12px',
                            background: T.card,
                            textDecoration: 'none',
                            transition: 'background 0.12s',
                            animationDelay: `${220 + i * 20}ms`,
                          }}
                          onMouseEnter={e => (e.currentTarget.style.background = T.cardHov)}
                          onMouseLeave={e => (e.currentTarget.style.background = T.card)}
                        >
                          <span style={{ fontSize: 8, letterSpacing: '0.14em', color: T.dim, minWidth: 30, flexShrink: 0 }}>
                            {meta?.label ?? doc.templateId.toUpperCase()}
                          </span>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 11, color: T.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {doc.title}
                            </div>
                            {proj && (
                              <div style={{ fontSize: 9, color: T.muted, marginTop: 2 }}>{proj.name}</div>
                            )}
                          </div>
                          <span style={{ fontSize: 9, color: T.dim, flexShrink: 0 }}>
                            {formatDate(doc.updatedAt)}
                          </span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
