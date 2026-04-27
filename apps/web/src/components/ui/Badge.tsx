import type { BadgeStatus } from '@kanan/shared';

const CLASS_MAP: Record<BadgeStatus, string> = {
  activo:      'badge ba',
  'en-curso':  'badge ba',
  hecho:       'badge ba',
  presente:    'badge ba',
  cotizando:   'badge bp',
  pendiente:   'badge bp',
  completado:  'badge bd',
  ausente:     'badge bd',
};

const LABEL_MAP: Record<BadgeStatus, string> = {
  activo:     'Activo',
  'en-curso': 'En curso',
  hecho:      'Hecho',
  presente:   'Presente',
  cotizando:  'Cotizando',
  pendiente:  'Pendiente',
  completado: 'Completado',
  ausente:    'Ausente',
};

interface BadgeProps {
  status: BadgeStatus;
  label?: string;
}

export function Badge({ status, label }: BadgeProps) {
  return (
    <span className={CLASS_MAP[status] ?? 'badge bd'}>
      {label ?? LABEL_MAP[status] ?? status}
    </span>
  );
}
