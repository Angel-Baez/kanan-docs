import { Schema, model, Document as MongoDoc } from 'mongoose';
import type { IHistorialEntry } from './Client.js';

export interface IProject extends MongoDoc {
  name: string;
  address1?: string;
  address2?: string;
  clientId: Schema.Types.ObjectId;
  status: 'cotizando' | 'activo' | 'completado' | 'garantia';
  startDate?: Date;
  endDate?: Date;
  totalAmount?: number;
  preferredTheme: 'base' | 't' | 'o' | 'plena';
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

const ProjectSchema = new Schema<IProject>(
  {
    name: { type: String, required: true },
    address1: String,
    address2: String,
    clientId: { type: Schema.Types.ObjectId, ref: 'Client', required: true },
    status: {
      type: String,
      enum: ['cotizando', 'activo', 'completado', 'garantia'],
      default: 'cotizando',
    },
    startDate: Date,
    endDate: Date,
    totalAmount: Number,
    preferredTheme: {
      type: String,
      enum: ['base', 't', 'o', 'plena'],
      default: 'o',
    },
    historial: { type: [HistorialEntrySchema], default: [] },
  },
  { timestamps: true }
);

ProjectSchema.index({ clientId: 1 });

export default model<IProject>('Project', ProjectSchema);
