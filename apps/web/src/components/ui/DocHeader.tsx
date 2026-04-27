import { KananLogo } from './KananLogo.tsx';
import { EditableField } from './EditableField.tsx';
import { useDocument } from '../../context/DocumentContext.tsx';

interface DocHeaderProps {
  docType: string;
  /** Label shown before the extra date, e.g. "Válida hasta:" or "Actualizado:" */
  extraDateLabel?: string;
  /** Field key in the document's fields object to read/write the extra date */
  extraDateField?: string;
}

export function DocHeader({ docType, extraDateLabel, extraDateField }: DocHeaderProps) {
  const { fields, dispatch } = useDocument();
  const f = fields as unknown as Record<string, unknown>;

  const set = (path: string, value: unknown) =>
    dispatch({ type: 'SET_FIELD', path, value });

  return (
    <div className="dh">
      <div className="lw">
        <div className="km">
          <KananLogo />
        </div>
        <div>
          <span className="wk">KANAN</span>
          <span className="ws">REMODELACIONES</span>
        </div>
      </div>
      <div className="dr">
        <div className="dty">{docType}</div>
        <div className="dn">
          <EditableField
            value={String(f['docNumber'] ?? '')}
            onChange={(v) => set('docNumber', v)}
            size={12}
          />
        </div>
        <div className="dd">
          <EditableField
            value={String(f['date'] ?? '')}
            onChange={(v) => set('date', v)}
            size={14}
          />
        </div>
        {extraDateLabel && extraDateField && (
          <div className="dd" style={{ fontSize: 10, color: 'var(--p)' }}>
            {extraDateLabel}{' '}
            <EditableField
              value={String(f[extraDateField] ?? '')}
              onChange={(v) => set(extraDateField, v)}
              size={14}
            />
          </div>
        )}
      </div>
    </div>
  );
}
