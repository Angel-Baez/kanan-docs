import { Schema, model, Document as MongoDoc } from 'mongoose';

export interface IStaff extends MongoDoc {
  name: string;
  role: string;
  cedula?: string;
  phone?: string;
  dailyRate: number;
  isActive: boolean;
}

const StaffSchema = new Schema<IStaff>(
  {
    name:      { type: String, required: true, trim: true },
    role:      { type: String, required: true, trim: true },
    cedula:    { type: String, trim: true },
    phone:     { type: String, trim: true },
    dailyRate: { type: Number, default: 0 },
    isActive:  { type: Boolean, default: true },
  },
  { timestamps: true }
);

StaffSchema.index({ name: 1 });

export default model<IStaff>('Staff', StaffSchema);
