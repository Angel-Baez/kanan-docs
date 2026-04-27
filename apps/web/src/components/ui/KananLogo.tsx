interface KananLogoProps {
  width?: number;
  height?: number;
}

export function KananLogo({ width = 28, height = 35 }: KananLogoProps) {
  return (
    <svg width={width} height={height} viewBox="0 0 32 40">
      <rect x="0" width="8" height="40" className="kb" />
      <rect x="24" width="8" height="8" className="kt" />
      <rect x="16" y="8" width="8" height="8" className="kb" />
      <rect x="8" y="16" width="8" height="8" className="kb" />
      <rect x="16" y="24" width="8" height="8" className="kb" />
      <rect x="24" y="32" width="8" height="8" className="kb" />
    </svg>
  );
}

// Small version for nav
export function KananLogoNav() {
  return (
    <svg width="18" height="22" viewBox="0 0 32 40">
      <rect x="0" width="8" height="40" fill="#F3EDE3" />
      <rect x="24" width="8" height="8" fill="#6B7A3F" />
      <rect x="16" y="8" width="8" height="8" fill="#F3EDE3" />
      <rect x="8" y="16" width="8" height="8" fill="#F3EDE3" />
      <rect x="16" y="24" width="8" height="8" fill="#F3EDE3" />
      <rect x="24" y="32" width="8" height="8" fill="#F3EDE3" />
    </svg>
  );
}
