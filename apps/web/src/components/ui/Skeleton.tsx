const SHIMMER_CSS = `
@keyframes k-shimmer {
  0%   { background-position: -200% 0; }
  100% { background-position:  200% 0; }
}
.k-skeleton {
  background: linear-gradient(90deg, #1E1B17 25%, #272320 50%, #1E1B17 75%);
  background-size: 200% 100%;
  animation: k-shimmer 1.6s ease-in-out infinite;
}
`;

let injected = false;
function injectCSS() {
  if (injected || typeof document === 'undefined') return;
  const style = document.createElement('style');
  style.textContent = SHIMMER_CSS;
  document.head.appendChild(style);
  injected = true;
}

interface SkeletonProps {
  width?:   string | number;
  height?:  string | number;
  radius?:  number;
  style?:   React.CSSProperties;
}

export function Skeleton({ width = '100%', height = 16, radius = 0, style }: SkeletonProps) {
  injectCSS();
  return (
    <div
      className="k-skeleton"
      style={{ width, height, borderRadius: radius, flexShrink: 0, ...style }}
    />
  );
}

// ── Preset skeletons ──────────────────────────────────────────────────────────

/** Card-shaped skeleton block */
export function CardSkeleton({ height = 100 }: { height?: number }) {
  injectCSS();
  return (
    <div style={{ background: '#1A1714', border: '1px solid #2A2520', padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div className="k-skeleton" style={{ width: 36, height: 36, borderRadius: '50%', flexShrink: 0 }} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div className="k-skeleton" style={{ height: 11, width: '60%' }} />
          <div className="k-skeleton" style={{ height: 8,  width: '40%' }} />
        </div>
      </div>
      {height > 80 && <div className="k-skeleton" style={{ height: 8, width: '80%', marginTop: 4 }} />}
    </div>
  );
}

/** Row-shaped skeleton for table/list rows */
export function RowSkeleton({ cols = 4 }: { cols?: number }) {
  injectCSS();
  const widths = ['40%', '20%', '15%', '15%', '10%'];
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 16,
      padding: '12px 16px', borderBottom: '1px solid #1E1B17',
    }}>
      {Array.from({ length: cols }).map((_, i) => (
        <div key={i} className="k-skeleton" style={{ height: 10, width: widths[i] ?? '15%', flexShrink: 0 }} />
      ))}
    </div>
  );
}

/** KPI card skeleton */
export function KpiSkeleton() {
  injectCSS();
  return (
    <div style={{ background: '#1E1B17', border: '1px solid #2A2520', padding: '20px 20px 18px', display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div className="k-skeleton" style={{ height: 8, width: '50%' }} />
      <div className="k-skeleton" style={{ height: 28, width: '60%' }} />
      <div className="k-skeleton" style={{ height: 7, width: '35%' }} />
    </div>
  );
}
