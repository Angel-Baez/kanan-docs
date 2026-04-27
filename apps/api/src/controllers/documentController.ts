import type { RequestHandler } from 'express';
import { z } from 'zod';
import DocumentModel from '../models/Document.js';
import ClientModel from '../models/Client.js';
import ProjectModel from '../models/Project.js';

// Util: dot-notation flatten para PATCH parcial
function flattenObject(
  obj: Record<string, unknown>,
  prefix = 'fields'
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    const key = `${prefix}.${k}`;
    if (v !== null && typeof v === 'object' && !Array.isArray(v)) {
      Object.assign(out, flattenObject(v as Record<string, unknown>, key));
    } else {
      out[key] = v;
    }
  }
  return out;
}

/**
 * Extract clientName / projectName from a document's fields and upsert the
 * corresponding Client and Project records. Then link them to the document.
 * Called silently — errors are swallowed so the main save never fails.
 */
/**
 * Normalize client/project field names across templates.
 * Some templates use template-specific names (e.g. contracteeName in CS)
 * instead of the canonical clientName / projectName.
 */
function extractClientProject(fields: Record<string, unknown>) {
  const str = (k: string) => (fields[k] as string | undefined)?.trim() || '';

  const clientName =
    str('clientName') ||        // most templates
    str('contracteeName') ||    // CS · Contrato de Servicios (contratante = client)
    '';

  const projectName =
    str('projectName') ||       // most templates
    '';

  // Contact details — try canonical names then template-specific aliases
  const phone   = str('clientPhone');
  const cedula  = str('clientCedula') || str('clientId');  // clientId = cédula in some templates
  const email   = str('clientEmail');
  const address1 = str('address1') || str('contracteeAddress');
  const address2 = str('address2');

  return { clientName, projectName, phone, cedula, email, address1, address2 };
}

async function autoLinkClientProject(
  docId: string,
  fields: Record<string, unknown>,
  theme: string
) {
  try {
    const { clientName, projectName, phone, cedula, email, address1, address2 } =
      extractClientProject(fields);

    if (!clientName) return;

    // Upsert client by name (case-insensitive match)
    const client = await ClientModel.findOneAndUpdate(
      { name: { $regex: new RegExp(`^${clientName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } },
      {
        $set: { name: clientName },
        $setOnInsert: {
          phone,
          cedula,
          email,
          address: address1 + (address2 ? `, ${address2}` : ''),
          type: 'residencial' as const,
        },
      },
      { upsert: true, new: true }
    );

    let projectId: string | undefined;

    if (projectName) {
      const project = await ProjectModel.findOneAndUpdate(
        {
          name: { $regex: new RegExp(`^${projectName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
          clientId: client._id,
        },
        {
          $set: { name: projectName },
          $setOnInsert: {
            clientId: client._id,
            address: address1 + (address2 ? `, ${address2}` : ''),
            preferredTheme: theme as 'base' | 't' | 'o' | 'plena',
          },
        },
        { upsert: true, new: true }
      );
      projectId = String(project._id);
    }

    // Link to document (only update what changed)
    await DocumentModel.updateOne(
      { _id: docId },
      { $set: { clientId: client._id, ...(projectId && { projectId }) } }
    );
  } catch {
    // Silent — never block the main save
  }
}

const createSchema = z.object({
  templateId: z.string(),
  title: z.string().optional(),
  theme: z.enum(['base', 't', 'o', 'plena']).optional(),
  projectId: z.string().optional(),
  clientId: z.string().optional(),
  fields: z.record(z.unknown()),
});

export const listDocuments: RequestHandler = async (req, res, next) => {
  try {
    const { templateId, clientId, projectId } = req.query;
    const filter: Record<string, unknown> = {};
    if (templateId) filter['templateId'] = templateId;
    if (clientId) filter['clientId'] = clientId;
    if (projectId) filter['projectId'] = projectId;
    const docs = await DocumentModel.find(filter).sort({ createdAt: -1 }).lean();
    res.json(docs);
  } catch (e) {
    next(e);
  }
};

export const createDocument: RequestHandler = async (req, res, next) => {
  try {
    const body = createSchema.parse(req.body);
    const doc = await DocumentModel.create(body);
    // Auto-link client/project in background (non-blocking)
    void autoLinkClientProject(
      String(doc._id),
      doc.fields as Record<string, unknown>,
      doc.theme
    );
    res.status(201).json(doc);
  } catch (e) {
    next(e);
  }
};

export const getDocument: RequestHandler = async (req, res, next) => {
  try {
    const doc = await DocumentModel.findById(req.params['id']).lean();
    if (!doc) { res.status(404).json({ error: 'Documento no encontrado' }); return; }
    res.json(doc);
  } catch (e) {
    next(e);
  }
};

export const replaceDocument: RequestHandler = async (req, res, next) => {
  try {
    const body = createSchema.parse(req.body);
    const doc = await DocumentModel.findByIdAndUpdate(
      req.params['id'],
      body,
      { new: true, runValidators: true }
    ).lean();
    if (!doc) { res.status(404).json({ error: 'Documento no encontrado' }); return; }
    res.json(doc);
  } catch (e) {
    next(e);
  }
};

export const patchFields: RequestHandler = async (req, res, next) => {
  try {
    const partialFields = req.body as Record<string, unknown>;
    const $set = flattenObject(partialFields);
    const doc = await DocumentModel.findByIdAndUpdate(
      req.params['id'],
      { $set },
      { new: true }
    ).lean();
    if (!doc) { res.status(404).json({ error: 'Documento no encontrado' }); return; }
    // Auto-link client/project in background whenever any client identifier is present
    const f = doc.fields as Record<string, unknown>;
    if (f['clientName'] || f['contracteeName']) {
      void autoLinkClientProject(
        String(doc._id),
        doc.fields as Record<string, unknown>,
        doc.theme
      );
    }
    res.json(doc);
  } catch (e) {
    next(e);
  }
};

export const patchMeta: RequestHandler = async (req, res, next) => {
  try {
    const schema = z.object({
      title: z.string().optional(),
      theme: z.enum(['base', 't', 'o', 'plena']).optional(),
      clientId: z.string().optional(),
      projectId: z.string().optional(),
    });
    const body = schema.parse(req.body);
    const doc = await DocumentModel.findByIdAndUpdate(
      req.params['id'],
      { $set: body },
      { new: true }
    ).lean();
    if (!doc) { res.status(404).json({ error: 'Documento no encontrado' }); return; }
    res.json(doc);
  } catch (e) {
    next(e);
  }
};

export const deleteDocument: RequestHandler = async (req, res, next) => {
  try {
    const doc = await DocumentModel.findByIdAndDelete(req.params['id']);
    if (!doc) { res.status(404).json({ error: 'Documento no encontrado' }); return; }
    res.status(204).send();
  } catch (e) {
    next(e);
  }
};

export const exportPdf: RequestHandler = async (req, res, next) => {
  try {
    const doc = await DocumentModel.findById(req.params['id']).lean();
    if (!doc) { res.status(404).json({ error: 'Documento no encontrado' }); return; }

    const puppeteer = await import('puppeteer');
    const browser = await puppeteer.default.launch({ headless: true });
    const page = await browser.newPage();

    const webUrl = process.env['WEB_URL'] ?? 'http://localhost:5173';
    await page.goto(`${webUrl}/documents/${req.params['id']}?print=1`, {
      waitUntil: 'networkidle0',
      timeout: 30000,
    });

    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '0', bottom: '0', left: '0', right: '0' },
    });

    await browser.close();

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${doc.title ?? 'documento'}.pdf"`,
    });
    res.send(pdf);
  } catch (e) {
    next(e);
  }
};
