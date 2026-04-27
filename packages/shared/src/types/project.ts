export type ProjectStatus = 'cotizando' | 'activo' | 'completado' | 'garantia';

export interface KananProject {
  _id: string;
  name: string;
  address?: string;
  clientId: string;
  status: ProjectStatus;
  startDate?: string;
  endDate?: string;
  totalAmount?: number;
  preferredTheme: 'base' | 't' | 'o' | 'plena';
  createdAt: string;
  updatedAt: string;
}
