import type { GanttPhase } from '@kanan/shared';

const WEEKS = [1, 2, 3, 4, 5, 6, 7, 8] as const;

const KANAN_COLORS = [
  { label: 'Terracota', value: '#B95D34' },
  { label: 'Oliva', value: '#6B7A3F' },
  { label: 'Carbón', value: '#1F1D1B' },
];

interface GanttChartProps {
  phases: GanttPhase[];
  onChange?: (phases: GanttPhase[]) => void;
  editable?: boolean;
}

export function GanttChart({ phases, onChange, editable = true }: GanttChartProps) {
  const update = (i: number, key: keyof GanttPhase, value: unknown) => {
    if (!onChange) return;
    const updated = phases.map((p, idx) =>
      idx === i ? { ...p, [key]: value } : p
    );
    onChange(updated);
  };

  const addPhase = () => {
    if (!onChange) return;
    onChange([
      ...phases,
      { name: `Fase ${phases.length + 1}`, startWeek: 1, endWeek: 1, color: '#B95D34' },
    ]);
  };

  const removePhase = (i: number) => {
    if (!onChange) return;
    onChange(phases.filter((_, idx) => idx !== i));
  };

  return (
    <div className="gw">
      <div className="gg">
        {/* Header */}
        <div className="gh">
          <div className="ghc">Fase</div>
          {WEEKS.map((w) => (
            <div key={w} className="ghc">Sem {w}</div>
          ))}
        </div>

        {/* Rows */}
        {phases.map((phase, i) => (
          <div key={i} className="gr">
            <div className="gp" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              {editable ? (
                <input
                  type="text"
                  value={phase.name}
                  onChange={(e) => update(i, 'name', e.target.value)}
                  className="e e--input"
                  style={{ fontSize: 11 }}
                  size={14}
                />
              ) : (
                phase.name
              )}
              {editable && (
                <button
                  className="row-del row-actions"
                  onClick={() => removePhase(i)}
                  title="Eliminar fase"
                  style={{ opacity: 1 }}
                >
                  ×
                </button>
              )}
            </div>
            {WEEKS.map((w) => (
              <div key={w} className="gc">
                {editable ? (
                  <div
                    className="gb"
                    style={{
                      background: w >= phase.startWeek && w <= phase.endWeek
                        ? phase.color
                        : 'rgba(139,130,121,.1)',
                      cursor: 'pointer',
                    }}
                    onClick={() => {
                      if (w < phase.startWeek) {
                        update(i, 'startWeek', w);
                      } else if (w > phase.endWeek) {
                        update(i, 'endWeek', w);
                      } else if (w === phase.startWeek && w === phase.endWeek) {
                        // reset: clicking the only active cell clears it
                        update(i, 'startWeek', w);
                        update(i, 'endWeek', w);
                      } else if (w === phase.startWeek) {
                        update(i, 'startWeek', w + 1);
                      } else if (w === phase.endWeek) {
                        update(i, 'endWeek', w - 1);
                      } else {
                        update(i, 'endWeek', w);
                      }
                    }}
                    title={`Sem ${w}`}
                  />
                ) : (
                  w >= phase.startWeek && w <= phase.endWeek ? (
                    <div className="gb" style={{ background: phase.color }} />
                  ) : null
                )}
              </div>
            ))}
          </div>
        ))}
      </div>

      {editable && (
        <div style={{ marginTop: 10, display: 'flex', gap: 12, alignItems: 'center' }}>
          <button className="add-row-btn" onClick={addPhase}>+ FASE</button>
          {phases.length > 0 && (
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              {KANAN_COLORS.map((c) => (
                <button
                  key={c.value}
                  title={c.label}
                  style={{
                    width: 14,
                    height: 14,
                    background: c.value,
                    border: '1px solid rgba(0,0,0,.15)',
                    cursor: 'pointer',
                    borderRadius: 1,
                  }}
                  onClick={() => {
                    // Apply color to last phase as default behavior
                    const last = phases.length - 1;
                    update(last, 'color', c.value);
                  }}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
