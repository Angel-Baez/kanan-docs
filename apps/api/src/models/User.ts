import { Schema, model, Document as MongoDoc } from 'mongoose';

export type UserRole = 'admin' | 'jefe_obra' | 'vendedor';

export interface IUser extends MongoDoc {
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  isActive: boolean;
}

const UserSchema = new Schema<IUser>(
  {
    name:         { type: String, required: true, trim: true },
    email:        { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role:         { type: String, enum: ['admin', 'jefe_obra', 'vendedor'], default: 'vendedor' },
    isActive:     { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default model<IUser>('User', UserSchema);
