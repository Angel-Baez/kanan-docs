export interface FinancialSummary {
  projectId: string;
  contratado: number;
  facturado: number;
  cobrado: number;
  saldoPendiente: number;
  ordenesExtra: number;
  costoMateriales: number;
  costoNomina: number;
  margenBruto: number;
  margenPct: number;
}

export interface ProjectFinancialRow extends FinancialSummary {
  projectName: string;
  clientName: string;
  status: string;
}

export interface CompanyFinancialSummary {
  contratado: number;
  facturado: number;
  cobrado: number;
  saldoPendiente: number;
  costoMateriales: number;
  costoNomina: number;
  margenBruto: number;
  byProject: ProjectFinancialRow[];
}
