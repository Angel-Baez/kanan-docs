import { Schema, model, Document as MongoDoc } from 'mongoose';

export interface ICompanySettings extends MongoDoc {
  name:    string;
  tagline: string;
  rnc:     string;
  phone:   string;
  email:   string;
  address: string;
  website: string;
}

const CompanySettingsSchema = new Schema<ICompanySettings>(
  {
    name:    { type: String, default: 'KANAN' },
    tagline: { type: String, default: 'REMODELACIONES' },
    rnc:     { type: String, default: '' },
    phone:   { type: String, default: '' },
    email:   { type: String, default: '' },
    address: { type: String, default: '' },
    website: { type: String, default: '' },
  },
  { timestamps: true }
);

export default model<ICompanySettings>('CompanySettings', CompanySettingsSchema);
