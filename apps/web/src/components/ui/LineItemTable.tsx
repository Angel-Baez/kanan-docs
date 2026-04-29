import { useEffect } from 'react';
import type { LineItem } from '@kanan/shared';
import { EditableField } from './EditableField.tsx';
import { useDocument } from '../../context/DocumentContext.tsx';

function emptyItem(): LineItem {
  return { description: '', unit: '', qty: 1, unitPrice: 0, total: 0 };
}

function fmt(n: number) {
  return n.toLocaleString('es-DO', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

interface LineItemTableProps {
  itemsPath?: string;   // default: 'items'
  showItbis?: boolean;
}

export function LineItemTable({ itemsPath = 'items', showItbis = true }: LineItemTableProps) {
  const { fields, dispatch } = useDocument();
  const f = fields as unknown as Record<string, unknown>;
  const items = (f[itemsPath] as LineItem[] | undefined) ?? [];

  const setField = (path: string, value: unknown) =>
    dispatch({ type: 'SET_FIELD', path, value });

  // calcular unidad x precio cada vez que cambie cantidad o precio unitario
  

  // Recalculate totals whenever items change
  useEffect(() => {
    const subtotal = items.reduce((acc, it) => acc + (it.total ?? 0), 0);
    const itbis = Math.round(subtotal * 18) / 100;
    setField('subtotal', subtotal);
    setField('itbis', itbis);
    setField('total', subtotal + itbis);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(items)]);

  const updateItem = (i: number, key: keyof LineItem, value: unknown) => {
    const updated = items.map((it, idx) => {
      if (idx !== i) return it;
      const next = { ...it, [key]: value };
      if (key === 'qty' || key === 'unitPrice') {
        next.total = Number(next.qty) * Number(next.unitPrice);
      }
      return next;
    });
    setField(itemsPath, updated);
  };

  const addItem = () => setField(itemsPath, [...items, emptyItem()]);

  const removeItem = (i: number) =>
    setField(itemsPath, items.filter((_, idx) => idx !== i));

  const subtotal = Number(f['subtotal'] ?? 0);
  const itbis    = Number(f['itbis'] ?? 0);
  const total    = Number(f['total'] ?? 0);

  return (
    <>
      <table>
        <thead>
          <tr>
            <th>Descripción</th>
            <th>Unidad</th>
            <th className="r" style={{ width: 60 }}>Cant.</th>
            <th className="r">P. Unit.</th>
            <th className="r">Total</th>
            <th style={{ width: 24 }} />
          </tr>
        </thead>
        <tbody>
          {items.map((item, i) => (
            <tr key={i}>
              <td>
                <EditableField
                  value={item.description}
                  onChange={(v) => updateItem(i, 'description', v)}
                  size={30}
                />
              </td>
              <td>
                <EditableField
                  value={item.unit}
                  onChange={(v) => updateItem(i, 'unit', v)}
                  size={4}
                />
              </td>
              <td className="r">
                <EditableField
                  value={String(item.qty)}
                  onChange={(v) => updateItem(i, 'qty', parseFloat(v.replace(/,/g, '')) || 1)}
                  numeric
                  size={4}
                />
              </td>
              <td className="r">
                <EditableField
                  value={String(item.unitPrice)}
                  onChange={(v) => updateItem(i, 'unitPrice', parseFloat(v.replace(/,/g, '')) || 0)}
                  numeric
                  size={4}
                />
              </td>
              <td className="r">
                <input
                  type="text"
                  readOnly
                  value={fmt(item.total)}
                  className="e e--input num"
                  size={10}
                />
              </td>
              <td>
                <span className="row-actions">
                  <button
                    className="row-del"
                    onClick={() => removeItem(i)}
                    title="Eliminar fila"
                  >
                    ×
                  </button>
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <button className="add-row-btn" onClick={addItem}>
        + AÑADIR PARTIDA
      </button>

      <div className="tot">
        <div className="ti">
          <div className="tl">SUBTOTAL</div>
          <div className="tv">RD$ {fmt(subtotal)}</div>
        </div>
        {showItbis && (
          <div className="ti">
            <div className="tl">ITBIS 18%</div>
            <div className="tv">RD$ {fmt(itbis)}</div>
          </div>
        )}
        <div className="ti g">
          <div className="tl">TOTAL</div>
          <div className="tv">RD$ {fmt(total)}</div>
        </div>
      </div>
    </>
  );
}
