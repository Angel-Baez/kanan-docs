import type { RequestHandler } from 'express';
import ProjectModel from '../models/Project.js';
import DocumentModel from '../models/Document.js';

export const getSummary: RequestHandler = async (_req, res, next) => {
  try {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      activeProjects,
      cotizando,
      recDocs,
      facturasPendientes,
      recentDocs,
      activeProjectList,
    ] = await Promise.all([
      ProjectModel.countDocuments({ status: 'activo' }),
      ProjectModel.countDocuments({ status: 'cotizando' }),
      DocumentModel.find({
        templateId: 'rec',
        createdAt: { $gte: monthStart },
      }).lean(),
      DocumentModel.countDocuments({
        templateId: 'fac',
        'fields.paymentStatus': 'pendiente',
      }),
      DocumentModel.find()
        .sort({ updatedAt: -1 })
        .limit(10)
        .populate({ path: 'projectId', select: 'name clientId' })
        .lean(),
      ProjectModel.find({ status: 'activo' })
        .sort({ updatedAt: -1 })
        .limit(9)
        .populate({ path: 'clientId', select: 'name' })
        .lean(),
    ]);

    const ingresosMes = recDocs.reduce((sum, d) => {
      const amount = Number((d.fields as Record<string, unknown>)['amount'] ?? 0);
      return sum + (isNaN(amount) ? 0 : amount);
    }, 0);

    res.json({
      activeProjects,
      cotizando,
      ingresosMes,
      facturasPendientes,
      recentDocs,
      activeProjectList,
    });
  } catch (e) {
    next(e);
  }
};
