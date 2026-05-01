import type { RequestHandler } from 'express';
import ProjectModel from '../models/Project.js';
import DocumentModel from '../models/Document.js';

export interface KananNotification {
  id: string;
  type: 'stale_project' | 'overdue_invoice' | 'overdue_task' | 'pending_punchlist';
  title: string;
  body: string;
  href: string;
  severity: 'warn' | 'error';
}

// GET /api/v1/notifications
export const getNotifications: RequestHandler = async (_req, res, next) => {
  try {
    const now        = new Date();
    const ago30      = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const notifications: KananNotification[] = [];

    // ── 1. Proyectos activos sin documentos actualizados en 30 días ──────────
    const activeProjects = await ProjectModel.find({ status: 'activo' })
      .select('_id name')
      .lean();

    for (const proj of activeProjects) {
      const latestDoc = await DocumentModel.findOne({ projectId: proj._id })
        .sort({ updatedAt: -1 })
        .select('updatedAt')
        .lean();

      if (!latestDoc || latestDoc.updatedAt < ago30) {
        const days = latestDoc
          ? Math.floor((now.getTime() - latestDoc.updatedAt.getTime()) / 86400000)
          : null;
        notifications.push({
          id:       `stale-${proj._id}`,
          type:     'stale_project',
          severity: 'warn',
          title:    proj.name,
          body:     days ? `Sin actividad hace ${days} días` : 'Sin documentos registrados',
          href:     `/projects/${proj._id}`,
        });
      }
    }

    // ── 2. Facturas pendientes de pago ───────────────────────────────────────
    const pendingFac = await DocumentModel.find({
      templateId:               'fac',
      'fields.paymentStatus':   'pendiente',
    })
      .select('_id title fields projectId')
      .lean();

    for (const doc of pendingFac) {
      const f = doc.fields as Record<string, unknown>;
      notifications.push({
        id:       `fac-${doc._id}`,
        type:     'overdue_invoice',
        severity: 'error',
        title:    (f['docNumber'] as string | undefined) ?? doc.title,
        body:     `Factura pendiente · ${(f['clientName'] as string | undefined) ?? ''}`,
        href:     `/documents/${doc._id}`,
      });
    }

    // ── 3. Action items de AR vencidos y pendientes ──────────────────────────
    const arDocs = await DocumentModel.find({ templateId: 'ar' })
      .select('_id title fields projectId')
      .lean();

    for (const doc of arDocs) {
      const f       = doc.fields as Record<string, unknown>;
      const items   = (f['actionItems'] as Array<Record<string, unknown>> | undefined) ?? [];
      const overdue = items.filter(item => {
        if ((item['status'] as string | undefined) !== 'pendiente') return false;
        const dl = item['deadline'] as string | undefined;
        if (!dl) return false;
        return new Date(dl) < now;
      });
      for (const item of overdue) {
        notifications.push({
          id:       `ar-${doc._id}-${item['task']}`,
          type:     'overdue_task',
          severity: 'warn',
          title:    (item['task'] as string | undefined) ?? 'Tarea sin título',
          body:     `Responsable: ${(item['responsible'] as string | undefined) ?? '—'} · Vencida`,
          href:     `/documents/${doc._id}`,
        });
      }
    }

    // ── 4. Punch list pendiente en proyecto completado ───────────────────────
    const completedIds = (await ProjectModel.find({ status: 'completado' }).select('_id').lean())
      .map(p => p._id);

    if (completedIds.length > 0) {
      const plDocs = await DocumentModel.find({
        templateId: 'pl',
        projectId:  { $in: completedIds },
      })
        .select('_id title fields projectId')
        .lean();

      for (const doc of plDocs) {
        const f     = doc.fields as Record<string, unknown>;
        const items = (f['items'] as Array<Record<string, unknown>> | undefined) ?? [];
        // PL items use "hecho" for done; anything else is open
        const open  = items.filter(i => {
          const s = (i['status'] as string | undefined) ?? '';
          return s !== 'hecho' && s !== 'completado';
        });
        if (open.length > 0) {
          notifications.push({
            id:       `pl-${doc._id}`,
            type:     'pending_punchlist',
            severity: 'warn',
            title:    doc.title,
            body:     `${open.length} ítem${open.length > 1 ? 's' : ''} pendiente${open.length > 1 ? 's' : ''} en proyecto completado`,
            href:     `/documents/${doc._id}`,
          });
        }
      }
    }

    res.json({ count: notifications.length, notifications });
  } catch (e) { next(e); }
};
