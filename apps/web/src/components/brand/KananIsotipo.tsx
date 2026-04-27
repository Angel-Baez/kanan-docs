import type { ThemeMode } from '@kanan/shared';

const CARBON    = '#1F1D1B';
const TERRACOTA = '#B95D34';
const OLIVO     = '#6B7A3F';

function accentColors(mode: ThemeMode): [string, string] {
  // returns [topRight, bottomRight]
  switch (mode) {
    case 't':     return [TERRACOTA, CARBON];
    case 'o':     return [OLIVO,     CARBON];
    case 'plena': return [TERRACOTA, OLIVO];
    default:      return [CARBON,    CARBON];
  }
}

interface KananIsotipoProps {
  mode?: ThemeMode;
  size?: number;
  className?: string;
}

export function KananIsotipo({ mode = 'o', size = 32, className }: KananIsotipoProps) {
  const [accent1, accent2] = accentColors(mode);
  const h = Math.round(size * 1.25); // 4:5 ratio

  return (
    <svg
      viewBox="0 0 128 160"
      width={size}
      height={h}
      className={className}
      aria-hidden="true"
    >
      <rect x="0"  y="0"   width="32" height="160" fill={CARBON} />
      <rect x="96" y="0"   width="32" height="32"  fill={accent1} />
      <rect x="64" y="32"  width="32" height="32"  fill={CARBON} />
      <rect x="32" y="64"  width="32" height="32"  fill={CARBON} />
      <rect x="64" y="96"  width="32" height="32"  fill={CARBON} />
      <rect x="96" y="128" width="32" height="32"  fill={accent2} />
    </svg>
  );
}
