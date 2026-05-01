import type { RequestHandler } from 'express';
import StaffModel from '../models/Staff.js';
import DocumentModel from '../models/Document.js';

// GET /api/v1/staff          → active only (for autocomplete)
// GET /api/v1/staff?all=true → all (for team roster)
export const listStaff: RequestHandler = async (req, res, next) => {
  try {
    const all = req.query['all'] === 'true';
    const filter = all ? {} : { isActive: true };
    const staff = await StaffModel.find(filter).sort({ name: 1 }).lean();
    res.json(staff);
  } catch (e) { next(e); }
};

// POST /api/v1/staff
export const createStaff: RequestHandler = async (req, res, next) => {
  try {
    const { name, role, cedula, phone, dailyRate } = req.body as Record<string, unknown>;
    if (!name || !role) {
      res.status(400).json({ error: 'Nombre y cargo requeridos' });
      return;
    }
    const member = await StaffModel.create({ name, role, cedula, phone, dailyRate: Number(dailyRate) || 0 });
    res.status(201).json(member);
  } catch (e) { next(e); }
};

// PATCH /api/v1/staff/:id
export const patchStaff: RequestHandler = async (req, res, next) => {
  try {
    const allowed = ['name', 'role', 'cedula', 'phone', 'dailyRate', 'isActive'];
    const update: Record<string, unknown> = {};
    for (const key of allowed) {
      if (key in req.body) update[key] = req.body[key];
    }
    const member = await StaffModel.findByIdAndUpdate(req.params['id'], update, { new: true }).lean();
    if (!member) { res.status(404).json({ error: 'Personal no encontrado' }); return; }
    res.json(member);
  } catch (e) { next(e); }
};

// GET /api/v1/payroll/summary?month=YYYY-MM
export const payrollSummary: RequestHandler = async (req, res, next) => {
  try {
    const monthParam = (req.query['month'] as string | undefined) ?? '';
    // Parse month → date range
    const [y, m] = monthParam.split('-').map(Number);
    const year  = y && !isNaN(y) ? y : new Date().getFullYear();
    const month = m && !isNaN(m) ? m - 1 : new Date().getMonth();
    const start = new Date(year, month, 1);
    const end   = new Date(year, month + 1, 1);

    // All HT docs created in this month
    const htDocs = await DocumentModel.find({
      templateId: 'ht',
      createdAt:  { $gte: start, $lt: end },
    }).lean();

    // Aggregate rows by worker name
    const byWorker = new Map<string, {
      name: string; role: string;
      totalDays: number; dailyRate: number; total: number;
      projectNames: Set<string>;
    }>();

    for (const doc of htDocs) {
      const f = doc.fields as Record<string, unknown>;
      const rows = (f['rows'] as Array<Record<string, unknown>> | undefined) ?? [];
      const projectName = (f['projectName'] as string | undefined) ?? '';

      for (const row of rows) {
        const name      = (row['name']      as string | undefined)?.trim() ?? '';
        const role      = (row['role']      as string | undefined)?.trim() ?? '';
        const totalDays = Number(row['totalDays'] ?? 0);
        const dailyRate = Number(row['dailyRate'] ?? 0);
        const total     = Number(row['total']     ?? 0);
        if (!name) continue;

        if (!byWorker.has(name)) {
          byWorker.set(name, { name, role, totalDays: 0, dailyRate, total: 0, projectNames: new Set() });
        }
        const w = byWorker.get(name)!;
        w.totalDays += totalDays;
        w.total     += total;
        if (projectName) w.projectNames.add(projectName);
        // Use the most recent dailyRate seen
        if (dailyRate > 0) w.dailyRate = dailyRate;
      }
    }

    const rows = [...byWorker.values()]
      .sort((a, b) => b.total - a.total)
      .map(w => ({
        name:         w.name,
        role:         w.role,
        totalDays:    w.totalDays,
        dailyRate:    w.dailyRate,
        total:        w.total,
        projectCount: w.projectNames.size,
      }));

    const grandTotal = rows.reduce((s, r) => s + r.total, 0);

    res.json({
      month: `${year}-${String(month + 1).padStart(2, '0')}`,
      rows,
      grandTotal,
      workerCount: rows.length,
      htDocCount:  htDocs.length,
    });
  } catch (e) { next(e); }
};
