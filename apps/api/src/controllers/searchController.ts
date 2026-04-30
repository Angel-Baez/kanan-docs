import type { RequestHandler } from 'express';
import ClientModel from '../models/Client.js';
import ProjectModel from '../models/Project.js';
import DocumentModel from '../models/Document.js';

// GET /api/v1/search?q=texto&limit=20
export const search: RequestHandler = async (req, res, next) => {
  try {
    const q     = ((req.query['q'] as string) ?? '').trim();
    const limit = Math.min(parseInt(req.query['limit'] as string) || 20, 40);

    if (!q || q.length < 2) {
      res.json({ clients: [], projects: [], documents: [] });
      return;
    }

    const regex = new RegExp(q, 'i');

    const [clients, projects, documents] = await Promise.all([
      ClientModel.find({ $or: [{ name: regex }, { email: regex }, { phone: regex }] })
        .select('name type email phone')
        .limit(limit)
        .lean(),

      ProjectModel.find({ $or: [{ name: regex }, { address1: regex }] })
        .select('name status address1 clientId')
        .limit(limit)
        .lean(),

      DocumentModel.find({ title: regex })
        .select('title templateId projectId updatedAt')
        .limit(limit)
        .lean(),
    ]);

    res.json({
      clients:   clients.map(c => ({ _id: c._id, name: c.name, type: c.type, href: `/clients/${c._id}` })),
      projects:  projects.map(p => ({ _id: p._id, name: p.name, status: p.status, address1: p.address1, href: `/projects/${p._id}` })),
      documents: documents.map(d => ({ _id: d._id, title: d.title, templateId: d.templateId, href: `/documents/${d._id}` })),
    });
  } catch (e) { next(e); }
};
