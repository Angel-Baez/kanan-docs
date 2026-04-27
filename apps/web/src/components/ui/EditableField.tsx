import { useState, useRef, useEffect, type KeyboardEvent, type ChangeEvent } from 'react';

interface EditableFieldProps {
  value: string;
  onChange: (v: string) => void;
  className?: string;
  placeholder?: string;
  multiline?: boolean;
  numeric?: boolean;
  readonly?: boolean;
  size?: number;
}

/**
 * Normalize a user-typed numeric string to a plain JS float string
 * so `parseFloat()` in parent components always receives a clean value.
 *
 * Handles both Dominican Republic format (1.500,50) and US format (1,500.50).
 *
 * Rules:
 *  - Multiple dots, no commas  → dots are thousands  → "1.500.000"  → "1500000"
 *  - Multiple commas, no dots  → commas are thousands → "1,500,000"  → "1500000"
 *  - Both dot and comma present → last one is the decimal separator
 *    "1.500,50" → "1500.50"   |   "1,500.50" → "1500.50"
 *  - Single dot only, 3 digits after → thousands   "1.500" → "1500"
 *  - Single dot only, ≠3 digits after → decimal     "1.5"  → "1.5"
 *  - Single comma only, 3 digits after → thousands  "1,500" → "1500"
 *  - Single comma only, ≠3 digits after → decimal   "1,50"  → "1.50"
 */
function normalizeNumeric(raw: string): string {
  const s = raw.trim();
  if (s === '' || s === '-') return s;

  const dotCount = (s.match(/\./g) ?? []).length;
  const commaCount = (s.match(/,/g) ?? []).length;

  if (dotCount === 0 && commaCount === 0) return s; // plain integer

  if (dotCount > 1 && commaCount === 0) {
    // "1.500.000" → thousands dots, no decimal
    return s.replace(/\./g, '');
  }
  if (commaCount > 1 && dotCount === 0) {
    // "1,500,000" → thousands commas, no decimal
    return s.replace(/,/g, '');
  }
  if (dotCount >= 1 && commaCount >= 1) {
    // Both present: whichever comes last is the decimal separator
    const lastDot = s.lastIndexOf('.');
    const lastComma = s.lastIndexOf(',');
    if (lastComma > lastDot) {
      // Dominican: "1.500,50" → remove dots, swap comma→dot
      return s.replace(/\./g, '').replace(',', '.');
    } else {
      // US: "1,500.50" → remove commas
      return s.replace(/,/g, '');
    }
  }
  // Single separator only
  if (dotCount === 1) {
    const afterDot = s.split('.')[1] ?? '';
    // Exactly 3 digits after dot AND there are digits before it → thousands separator
    if (afterDot.length === 3 && /^\d/.test(s)) return s.replace('.', '');
    return s; // decimal dot
  }
  // commaCount === 1
  const afterComma = s.split(',')[1] ?? '';
  if (afterComma.length === 3 && /^\d/.test(s)) return s.replace(',', ''); // thousands
  return s.replace(',', '.'); // decimal comma
}

// Short single-line fields: real <input> styled to look inline
function InlineInput({
  value,
  onChange,
  className = '',
  placeholder = '···',
  numeric,
  readonly: readonlyProp,
  size,
}: EditableFieldProps) {
  // Local buffer so numeric fields can hold mid-typing state (e.g. "1,500.")
  // without parent's parseFloat resetting the input on every keystroke.
  // Guard against undefined value (fields missing from older saved documents)
  const [local, setLocal] = useState(value ?? '');

  // Sync from parent when external state changes (e.g. LOAD document action)
  useEffect(() => {
    setLocal(value ?? '');
  }, [value]);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setLocal(raw);
    // Non-numeric fields: propagate immediately (no parseFloat danger)
    if (!numeric) onChange(raw);
  };

  const handleBlur = () => {
    // Numeric fields: normalize thousands/decimal separators before propagating
    // so parent parseFloat("1500.50") works regardless of how the user typed it.
    if (numeric) onChange(normalizeNumeric(local ?? ''));
  };

  // Respect explicit size as a minimum, but grow to fit actual content
  const displaySize = Math.max(size ?? 4, (local ?? '').length || 4, 4);

  return (
    <input
      type="text"
      inputMode={numeric ? 'decimal' : 'text'}
      value={local}
      onChange={handleChange}
      onBlur={handleBlur}
      placeholder={placeholder}
      readOnly={readonlyProp}
      size={displaySize}
      className={`e e--input ${numeric ? 'num' : ''} ${className}`}
    />
  );
}

// Multi-line prose fields: contentEditable span (preserves flow layout for print)
function ProseField({
  value,
  onChange,
  className = '',
  placeholder = '···',
}: EditableFieldProps) {
  const ref = useRef<HTMLSpanElement>(null);

  // Sync DOM → state only on blur (avoids cursor jump on every keystroke)
  const handleBlur = () => {
    onChange(ref.current?.textContent ?? '');
  };

  // Sync state → DOM when value changes externally (e.g. LOAD action)
  useEffect(() => {
    if (ref.current && ref.current.textContent !== value) {
      ref.current.textContent = value;
    }
  }, [value]);

  const handleKeyDown = (e: KeyboardEvent<HTMLSpanElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      ref.current?.blur();
    }
  };

  return (
    <span
      ref={ref}
      role="textbox"
      contentEditable
      suppressContentEditableWarning
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      data-placeholder={placeholder}
      className={`e ${className}`}
    />
  );
}

export function EditableField(props: EditableFieldProps) {
  if (props.multiline) return <ProseField {...props} />;
  return <InlineInput {...props} />;
}
