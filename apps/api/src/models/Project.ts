import { Schema, model, Document as MongoDoc } from 'mongoose';

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
}

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
  },
  { timestamps: true }
);

ProjectSchema.index({ clientId: 1 });

export default model<IProject>('Project', ProjectSchema);
