export interface HistorialEntry {
  campo: string;
  valorAnterior: string;
  valorNuevo: string;
  fecha: string;
  nota?: string;
}

export interface KananClient {
  _id: string;
  name: string;
  cedula?: string;
  phone?: string;
  email?: string;
  address1?: string;
  address2?: string;
  type: 'residencial' | 'comercial' | 'institucional';
  historial: HistorialEntry[];
  createdAt: string;
  updatedAt: string;
}
