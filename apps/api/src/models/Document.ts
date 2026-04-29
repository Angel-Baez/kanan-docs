import { Schema, model, Document as MongoDoc } from 'mongoose';
import type { TemplateId, ThemeMode } from '../../../../packages/shared/src/index.ts';

export interface IDocument extends MongoDoc {
  templateId: TemplateId;
  title: string;
  projectId: Schema.Types.ObjectId;
  theme: ThemeMode;
  fields: Record<string, unknown>;
}

const DocumentSchema = new Schema<IDocument>(
  {
    templateId: { type: String, required: true },
    title: { type: String, default: 'Sin título' },
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
    theme: {
      type: String,
      enum: ['base', 't', 'o', 'plena'],
      default: 'o',
    },
    fields: { type: Schema.Types.Mixed, required: true, default: {} },
  },
  { timestamps: true }
);

DocumentSchema.index({ templateId: 1, createdAt: -1 });
DocumentSchema.index({ projectId: 1 });

export default model<IDocument>('Document', DocumentSchema);
