import type { RequestHandler } from 'express';
import { z } from 'zod';
import DocumentModel from '../models/Document.js';
import ProjectModel from '../models/Project.js';

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

const createSchema = z.object({
  templateId: z.string(),
  title: z.string().optional(),
  theme: z.enum(['base', 't', 'o', 'plena']).optional(),
  projectId: z.string().min(1),
  fields: z.record(z.unknown()),
});

export const listDocuments: RequestHandler = async (req, res, next) => {
  try {
    const { templateId, clientId, projectId } = req.query;
    const filter: Record<string, unknown> = {};
    if (templateId) filter['templateId'] = templateId;
    if (projectId) {
      filter['projectId'] = projectId;
    } else if (clientId) {
      // Join via Project to find all docs belonging to a client
      const projects = await ProjectModel.find({ clientId }).select('_id').lean();
      filter['projectId'] = { $in: projects.map(p => p._id) };
    }
    const docs = await DocumentModel.find(filter)
      .populate({ path: 'projectId', select: 'name clientId' })
      .sort({ createdAt: -1 })
      .lean();
    res.json(docs);
  } catch (e) {
    next(e);
  }
};

export const createDocument: RequestHandler = async (req, res, next) => {
  try {
    const body = createSchema.parse(req.body);
    const project = await ProjectModel.findById(body.projectId).lean();
    if (!project) {
      res.status(404).json({ error: 'Proyecto no encontrado' });
      return;
    }
    const doc = await DocumentModel.create(body);
    const populated = await DocumentModel.findById(doc._id)
      .populate({ path: 'projectId', select: 'name clientId' })
      .lean();
    res.status(201).json(populated);
  } catch (e) {
    next(e);
  }
};

export const getDocument: RequestHandler = async (req, res, next) => {
  try {
    const doc = await DocumentModel.findById(req.params['id'])
      .populate({ path: 'projectId', select: 'name clientId' })
      .lean();
    if (!doc) { res.status(404).json({ error: 'Documento no encontrado' }); return; }
    res.json(doc);
  } catch (e) {
    next(e);
  }
};

export const replaceDocument: RequestHandler = async (req, res, next) => {
  try {
    const body = createSchema.parse(req.body);
    const project = await ProjectModel.findById(body.projectId).lean();
    if (!project) {
      res.status(404).json({ error: 'Proyecto no encontrado' });
      return;
    }
    const doc = await DocumentModel.findByIdAndUpdate(
      req.params['id'],
      body,
      { new: true, runValidators: true }
    )
      .populate({ path: 'projectId', select: 'name clientId' })
      .lean();
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
    )
      .populate({ path: 'projectId', select: 'name clientId' })
      .lean();
    if (!doc) { res.status(404).json({ error: 'Documento no encontrado' }); return; }
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
      projectId: z.string().optional(),
    });
    const body = schema.parse(req.body);
    if (body.projectId) {
      const project = await ProjectModel.findById(body.projectId).lean();
      if (!project) {
        res.status(404).json({ error: 'Proyecto no encontrado' });
        return;
      }
    }
    const doc = await DocumentModel.findByIdAndUpdate(
      req.params['id'],
      { $set: body },
      { new: true }
    )
      .populate({ path: 'projectId', select: 'name clientId' })
      .lean();
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
