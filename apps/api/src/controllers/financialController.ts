import type { RequestHandler } from 'express';
import DocumentModel from '../models/Document.js';
import ProjectModel from '../models/Project.js';
import ClientModel from '../models/Client.js';
import type { FinancialSummary, ProjectFinancialRow, CompanyFinancialSummary } from '../../../../packages/shared/src/index.ts';

const FINANCIAL_TEMPLATES = ['cot', 'fac', 'rec', 'oc', 'rm', 'ht'] as const;

function n(v: unknown): number {
  const x = Number(v);
  return isNaN(x) ? 0 : x;
}

function calcFinancials(
  projectId: string,
  docs: Array<{ templateId: string; fields: Record<string, unknown>; createdAt?: unknown }>,
): FinancialSummary {
  const byType = (tid: string) => docs.filter(d => d.templateId === tid);

  // Most recent COT is the contracted amount
  const cotDocs = byType('cot').sort((a, b) =>
    new Date(b.createdAt as string).getTime() - new Date(a.createdAt as string).getTime()
  );
  const contratado = n(cotDocs[0]?.fields['total']);

  const facturado = byType('fac').reduce((s, d) => s + n(d.fields['total']), 0);
  const cobrado   = byType('rec').reduce((s, d) => s + n(d.fields['amount']), 0);
  const ordenesExtra    = byType('oc').reduce((s, d) => s + n(d.fields['total']), 0);
  const costoMateriales = byType('rm').reduce((s, d) => s + n(d.fields['total']), 0);
  const costoNomina     = byType('ht').reduce((s, d) => s + n(d.fields['totalPayroll']), 0);

  const saldoPendiente = facturado - cobrado;
  const margenBruto    = cobrado - costoMateriales - costoNomina;
  const base           = cobrado || contratado;
  const margenPct      = base > 0 ? Math.round((margenBruto / base) * 1000) / 10 : 0;

  return {
    projectId,
    contratado,
    facturado,
    cobrado,
    saldoPendiente,
    ordenesExtra,
    costoMateriales,
    costoNomina,
    margenBruto,
    margenPct,
  };
}

export const getProjectFinancials: RequestHandler = async (req, res, next) => {
  try {
    const id = req.params['id'] as string;
    const docs = await DocumentModel.find({
      projectId: id,
      templateId: { $in: FINANCIAL_TEMPLATES },
    }).lean();

    const typed = docs.map(d => ({
      templateId: d.templateId,
      fields: d.fields as Record<string, unknown>,
      createdAt: (d as unknown as { createdAt: unknown }).createdAt,
    }));

    res.json(calcFinancials(id, typed));
  } catch (e) {
    next(e);
  }
};

export const getCompanySummary: RequestHandler = async (_req, res, next) => {
  try {
    const [projects, clients, docs] = await Promise.all([
      ProjectModel.find().lean(),
      ClientModel.find({}, 'name').lean(),
      DocumentModel.find({ templateId: { $in: FINANCIAL_TEMPLATES } }).lean(),
    ]);

    const clientMap = new Map(clients.map(c => [String(c._id), c.name]));

    const docsByProject = new Map<string, typeof docs>();
    for (const doc of docs) {
      const pid = String(doc.projectId);
      if (!docsByProject.has(pid)) docsByProject.set(pid, []);
      docsByProject.get(pid)!.push(doc);
    }

    const byProject: ProjectFinancialRow[] = projects.map(p => {
      const pid = String(p._id);
      const pDocs = (docsByProject.get(pid) ?? []).map(d => ({
        templateId: d.templateId,
        fields: d.fields as Record<string, unknown>,
        createdAt: (d as unknown as { createdAt: unknown }).createdAt,
      }));
      return {
        ...calcFinancials(pid, pDocs),
        projectName: p.name,
        clientName: clientMap.get(String(p.clientId)) ?? '—',
        status: p.status,
      };
    });

    const sum = <K extends keyof FinancialSummary>(key: K) =>
      byProject.reduce((s, r) => s + (r[key] as number), 0);

    const summary: CompanyFinancialSummary = {
      contratado:      sum('contratado'),
      facturado:       sum('facturado'),
      cobrado:         sum('cobrado'),
      saldoPendiente:  sum('saldoPendiente'),
      costoMateriales: sum('costoMateriales'),
      costoNomina:     sum('costoNomina'),
      margenBruto:     sum('margenBruto'),
      byProject,
    };

    res.json(summary);
  } catch (e) {
    next(e);
  }
};
