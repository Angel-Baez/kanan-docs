import type { RequestHandler } from 'express';
import DocumentModel from '../models/Document.js';
import ProjectModel from '../models/Project.js';

export interface CalendarEvent {
  id:    string;
  title: string;
  start: string;   // ISO date
  end?:  string;   // ISO date (exclusive)
  color: string;
  type:  'gantt_phase' | 'ot' | 'ar_meeting' | 'project';
  href:  string;
}

// Parse "DD · MMM · YYYY" → Date | null
const MONTHS: Record<string, number> = {
  ENE:0, FEB:1, MAR:2, ABR:3, MAY:4, JUN:5,
  JUL:6, AGO:7, SEP:8, OCT:9, NOV:10, DIC:11,
};
function parseDocDate(s: unknown): Date | null {
  if (typeof s !== 'string') return null;
  const parts = s.split('·').map(p => p.trim());
  if (parts.length !== 3) return null;
  const day = parseInt(parts[0]);
  const mon = MONTHS[parts[1].toUpperCase()];
  const yr  = parseInt(parts[2]);
  if (isNaN(day) || mon === undefined || isNaN(yr)) return null;
  return new Date(yr, mon, day);
}

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function addDays(d: Date, n: number): Date {
  return new Date(d.getTime() + n * 86400000);
}

// GET /api/v1/calendar?start=YYYY-MM-DD&end=YYYY-MM-DD
export const getCalendarEvents: RequestHandler = async (req, res, next) => {
  try {
    const startParam = req.query['start'] as string | undefined;
    const endParam   = req.query['end']   as string | undefined;
    const rangeStart = startParam ? new Date(startParam) : new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1);
    const rangeEnd   = endParam   ? new Date(endParam)   : new Date(new Date().getFullYear(), new Date().getMonth() + 3, 1);

    const events: CalendarEvent[] = [];

    // ── 1. GANTT phases ──────────────────────────────────────────────────────
    const ganttDocs = await DocumentModel.find({ templateId: 'gantt' })
      .select('_id title fields projectId')
      .lean();

    for (const doc of ganttDocs) {
      const f       = doc.fields as Record<string, unknown>;
      const anchor  = parseDocDate(f['date']);
      if (!anchor) continue;

      const phases = (f['phases'] as Array<Record<string, unknown>> | undefined) ?? [];
      const projName = (f['projectName'] as string | undefined) ?? doc.title;

      for (const [pi, phase] of phases.entries()) {
        const sw    = Number(phase['startWeek'] ?? 1);
        const ew    = Number(phase['endWeek']   ?? sw);
        const start = addDays(anchor, (sw - 1) * 7);
        const end   = addDays(anchor, ew * 7);          // exclusive end
        const color = (phase['color'] as string | undefined) ?? '#B95D34';
        const name  = (phase['name']  as string | undefined) ?? `Fase ${pi + 1}`;

        if (end < rangeStart || start > rangeEnd) continue;

        events.push({
          id:    `gantt-${doc._id}-${pi}`,
          title: `${name} · ${projName}`,
          start: isoDate(start),
          end:   isoDate(end),
          color,
          type:  'gantt_phase',
          href:  `/documents/${doc._id}`,
        });
      }
    }

    // ── 2. OT — start + estimated delivery ───────────────────────────────────
    const otDocs = await DocumentModel.find({ templateId: 'ot' })
      .select('_id title fields')
      .lean();

    for (const doc of otDocs) {
      const f     = doc.fields as Record<string, unknown>;
      const start = parseDocDate(f['startDate']);
      const end   = parseDocDate(f['estimatedDelivery']);
      if (!start) continue;
      if ((end ?? start) < rangeStart || start > rangeEnd) continue;

      const projName = (f['projectName'] as string | undefined) ?? doc.title;
      events.push({
        id:    `ot-${doc._id}`,
        title: `OT · ${projName}`,
        start: isoDate(start),
        end:   end ? isoDate(addDays(end, 1)) : undefined,
        color: '#7A8C47',
        type:  'ot',
        href:  `/documents/${doc._id}`,
      });
    }

    // ── 3. AR — next meeting ──────────────────────────────────────────────────
    const arDocs = await DocumentModel.find({ templateId: 'ar' })
      .select('_id title fields')
      .lean();

    for (const doc of arDocs) {
      const f    = doc.fields as Record<string, unknown>;
      const nm   = f['nextMeeting'] as Record<string, unknown> | undefined;
      const date = parseDocDate(nm?.['date']);
      if (!date) continue;
      if (date < rangeStart || date > rangeEnd) continue;

      const projName = (f['projectName'] as string | undefined) ?? doc.title;
      const topic    = (nm?.['topic'] as string | undefined) ?? 'Reunión';

      events.push({
        id:    `ar-${doc._id}`,
        title: `${topic} · ${projName}`,
        start: isoDate(date),
        color: '#5B7FA6',
        type:  'ar_meeting',
        href:  `/documents/${doc._id}`,
      });
    }

    // ── 4. Project timelines ─────────────────────────────────────────────────
    const projects = await ProjectModel.find({
      startDate: { $exists: true, $ne: null },
    })
      .select('_id name status startDate endDate')
      .lean();

    for (const proj of projects) {
      if (!proj.startDate) continue;
      const start = new Date(proj.startDate);
      const end   = proj.endDate ? new Date(proj.endDate) : addDays(start, 60);
      if (end < rangeStart || start > rangeEnd) continue;

      const COLOR: Record<string, string> = {
        cotizando:  '#6B5A3A',
        activo:     '#B95D34',
        completado: '#4A6A2A',
        garantia:   '#5B7FA6',
      };

      events.push({
        id:    `proj-${proj._id}`,
        title: proj.name,
        start: isoDate(start),
        end:   isoDate(addDays(end, 1)),
        color: COLOR[proj.status] ?? '#4A4540',
        type:  'project',
        href:  `/projects/${proj._id}`,
      });
    }

    res.json({ events });
  } catch (e) { next(e); }
};
