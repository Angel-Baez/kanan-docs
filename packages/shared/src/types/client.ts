export interface KananClient {
  _id: string;
  name: string;
  cedula?: string;
  phone?: string;
  email?: string;
  address?: string;
  type: 'residencial' | 'comercial' | 'institucional';
  createdAt: string;
  updatedAt: string;
}
