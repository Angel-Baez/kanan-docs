import { Schema, model, Document as MongoDoc } from 'mongoose';

export interface IHistorialEntry {
  campo: string;
  valorAnterior?: string;
  valorNuevo?: string;
  fecha: Date;
  nota?: string;
}

export interface IClient extends MongoDoc {
  name: string;
  cedula?: string;
  phone?: string;
  email?: string;
  address1?: string;
  address2?: string;
  type: 'residencial' | 'comercial' | 'institucional';
  historial: IHistorialEntry[];
}

const HistorialEntrySchema = new Schema<IHistorialEntry>(
  {
    campo: { type: String, required: true },
    valorAnterior: String,
    valorNuevo: String,
    fecha: { type: Date, default: Date.now },
    nota: String,
  },
  { _id: false }
);

const ClientSchema = new Schema<IClient>(
  {
    name: { type: String, required: true },
    cedula: String,
    phone: String,
    email: String,
    address1: String,
    address2: String,
    type: {
      type: String,
      enum: ['residencial', 'comercial', 'institucional'],
      default: 'residencial',
    },
    historial: { type: [HistorialEntrySchema], default: [] },
  },
  { timestamps: true }
);

ClientSchema.index({ name: 'text' });

export default model<IClient>('Client', ClientSchema);
