interface PaginationProps {
  page:     number;
  pages:    number;
  total:    number;
  limit:    number;
  onChange: (p: number) => void;
}

export function Pagination({ page, pages, total, limit, onChange }: PaginationProps) {
  if (pages <= 1) return null;

  const from = (page - 1) * limit + 1;
  const to   = Math.min(page * limit, total);

  // Show up to 7 page numbers with ellipsis
  const nums: (number | '…')[] = [];
  if (pages <= 7) {
    for (let i = 1; i <= pages; i++) nums.push(i);
  } else {
    nums.push(1);
    if (page > 3) nums.push('…');
    for (let i = Math.max(2, page - 1); i <= Math.min(pages - 1, page + 1); i++) nums.push(i);
    if (page < pages - 2) nums.push('…');
    nums.push(pages);
  }

  const btn: React.CSSProperties = {
    fontFamily: "'IBM Plex Mono', monospace",
    fontSize: 9, letterSpacing: '0.1em',
    background: 'transparent',
    border: '1px solid #2A2520',
    color: '#7A7068',
    padding: '5px 10px',
    cursor: 'pointer',
    minWidth: 32,
    transition: 'all 0.1s',
  };

  const btnActive: React.CSSProperties = {
    ...btn,
    background: '#B95D34',
    borderColor: '#B95D34',
    color: '#fff',
    cursor: 'default',
  };

  const btnDisabled: React.CSSProperties = {
    ...btn,
    opacity: 0.3,
    cursor: 'not-allowed',
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 24, flexWrap: 'wrap', gap: 12 }}>
      {/* Info */}
      <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, color: '#4A4540', letterSpacing: '0.1em' }}>
        {from}–{to} de {total}
      </span>

      {/* Controls */}
      <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
        <button
          onClick={() => onChange(page - 1)}
          disabled={page === 1}
          style={page === 1 ? btnDisabled : btn}
          onMouseEnter={e => { if (page !== 1) { e.currentTarget.style.borderColor = '#3A3530'; e.currentTarget.style.color = '#E8DFCF'; } }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = '#2A2520'; e.currentTarget.style.color = '#7A7068'; }}
        >
          ←
        </button>

        {nums.map((n, i) =>
          n === '…' ? (
            <span key={`e${i}`} style={{ ...btn, border: 'none', cursor: 'default', color: '#4A4540' }}>…</span>
          ) : (
            <button
              key={n}
              onClick={() => n !== page && onChange(n)}
              style={n === page ? btnActive : btn}
              onMouseEnter={e => { if (n !== page) { e.currentTarget.style.borderColor = '#3A3530'; e.currentTarget.style.color = '#E8DFCF'; } }}
              onMouseLeave={e => { if (n !== page) { e.currentTarget.style.borderColor = '#2A2520'; e.currentTarget.style.color = '#7A7068'; } }}
            >
              {n}
            </button>
          )
        )}

        <button
          onClick={() => onChange(page + 1)}
          disabled={page === pages}
          style={page === pages ? btnDisabled : btn}
          onMouseEnter={e => { if (page !== pages) { e.currentTarget.style.borderColor = '#3A3530'; e.currentTarget.style.color = '#E8DFCF'; } }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = '#2A2520'; e.currentTarget.style.color = '#7A7068'; }}
        >
          →
        </button>
      </div>
    </div>
  );
}
