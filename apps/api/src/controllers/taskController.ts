import type { RequestHandler } from 'express';
import DocumentModel from '../models/Document.js';
import ProjectModel from '../models/Project.js';
import ClientModel from '../models/Client.js';
import type { TaskItem } from '../../../../packages/shared/src/index.ts';

export const listTasks: RequestHandler = async (req, res, next) => {
  try {
    const { status, responsible, projectId } = req.query as Record<string, string | undefined>;

    const docFilter: Record<string, unknown> = { templateId: { $in: ['ar', 'ot'] } };
    if (projectId) docFilter['projectId'] = projectId;

    const docs = await DocumentModel.find(docFilter).sort({ createdAt: -1 }).lean();

    const projectIds = [...new Set(docs.map(d => String(d.projectId)))];
    const [projects, clients] = await Promise.all([
      ProjectModel.find({ _id: { $in: projectIds } }, 'name clientId').lean(),
      ProjectModel.find({ _id: { $in: projectIds } }, 'clientId').lean().then(async projs => {
        const clientIds = [...new Set(projs.map(p => String(p.clientId)))];
        return ClientModel.find({ _id: { $in: clientIds } }, 'name').lean();
      }),
    ]);

    const projectMap = new Map(projects.map(p => [String(p._id), p]));
    const clientMap  = new Map(clients.map(c => [String(c._id), c.name]));

    const tasks: TaskItem[] = [];

    for (const doc of docs) {
      const proj = projectMap.get(String(doc.projectId));
      const projectName = proj?.name ?? '—';
      const clientName  = proj ? (clientMap.get(String(proj.clientId)) ?? '—') : '—';
      const fields = doc.fields as Record<string, unknown>;
      const docId = String(doc._id);
      const createdAt = String((doc as unknown as { createdAt: unknown }).createdAt ?? '');

      if (doc.templateId === 'ar') {
        const items = (fields['actionItems'] as Array<Record<string, string>> | undefined) ?? [];
        items.forEach((item, idx) => {
          tasks.push({
            id: `${docId}-ar-${idx}`,
            type: 'ar',
            description: item['task'] ?? '',
            responsible:  item['responsible'] ?? '',
            deadline:     item['deadline'] || undefined,
            status:       item['status'] ?? 'pendiente',
            docId,
            docTitle: doc.title,
            projectId: String(doc.projectId),
            projectName,
            clientName,
            createdAt,
          });
        });
      }

      if (doc.templateId === 'ot') {
        const items = (fields['tasks'] as Array<Record<string, string>> | undefined) ?? [];
        items.forEach((item, idx) => {
          tasks.push({
            id: `${docId}-ot-${idx}`,
            type: 'ot',
            description: item['description'] ?? '',
            responsible:  item['responsible'] ?? '',
            days:         item['days'] || undefined,
            status:       item['status'] ?? 'pendiente',
            docId,
            docTitle: doc.title,
            projectId: String(doc.projectId),
            projectName,
            clientName,
            createdAt,
          });
        });
      }
    }

    // Filter by status and responsible
    const filtered = tasks.filter(t => {
      if (status && status !== 'all' && t.status !== status) return false;
      if (responsible && !t.responsible.toLowerCase().includes(responsible.toLowerCase())) return false;
      if (!t.description.trim()) return false;
      return true;
    });

    // Sort: pending first, then en-curso, then hecho; within each group by deadline
    const ORDER: Record<string, number> = { pendiente: 0, 'en-curso': 1, hecho: 2 };
    filtered.sort((a, b) => {
      const od = (ORDER[a.status] ?? 9) - (ORDER[b.status] ?? 9);
      if (od !== 0) return od;
      if (a.deadline && b.deadline) return a.deadline.localeCompare(b.deadline);
      if (a.deadline) return -1;
      if (b.deadline) return 1;
      return 0;
    });

    res.json(filtered);
  } catch (e) {
    next(e);
  }
};
