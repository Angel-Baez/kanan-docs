import type { HistorialEntry } from './client.js';

export type ProjectStatus = 'cotizando' | 'activo' | 'completado' | 'garantia';

export interface KananProject {
  _id: string;
  name: string;
  address1?: string;
  address2?: string;
  clientId: string;
  status: ProjectStatus;
  startDate?: string;
  endDate?: string;
  totalAmount?: number;
  preferredTheme: 'base' | 't' | 'o' | 'plena';
  historial: HistorialEntry[];
  createdAt: string;
  updatedAt: string;
}
