export type TemplateId =
  | 'cot' | 'fac' | 'rec' | 'sow' | 'ot' | 'gantt'
  | 'reg' | 'oc' | 'ae' | 'pl' | 'rd' | 'vt'
  | 'cs' | 'pv' | 'gr' | 'ec' | 'es' | 'ht' | 'rm' | 'ar';

export type ThemeMode = 'base' | 't' | 'o' | 'plena';

export type BadgeStatus =
  | 'activo' | 'cotizando' | 'completado' | 'pendiente'
  | 'en-curso' | 'hecho' | 'presente' | 'ausente';

export interface LineItem {
  description: string;
  unit: string;
  qty: number;
  unitPrice: number;
  total: number;
}

export interface GanttPhase {
  name: string;
  startWeek: number;
  endWeek: number;
  color: string;
}

export interface PaymentTranche {
  label: string;
  percentage: number;
  amount: number;
}

export interface PunchItem {
  number: number;
  location: string;
  description: string;
  responsible: string;
  date: string;
  status: BadgeStatus;
}

export interface TimesheetRow {
  name: string;
  role: string;
  days: (number | null)[];
  totalDays: number;
  dailyRate: number;
  total: number;
}

export interface MeetingAttendee {
  name: string;
  role: string;
  status: 'Presente' | 'Ausente';
}

export interface ActionItem {
  task: string;
  responsible: string;
  deadline: string;
  status: BadgeStatus;
}

// ── 01 · COT — Cotización ──────────────────────────────────────────────────
export interface CotFields {
  docNumber: string;
  date: string;
  validUntil: string;
  clientName: string;
  clientPhone: string;
  clientEmail: string;
  projectName: string;
  address1: string;
  address2: string;
  vtRef: string;
  items: LineItem[];
  subtotal: number;
  itbis: number;
  total: number;
  conditions: string;
}

// ── 02 · FAC — Factura ────────────────────────────────────────────────────
export interface FacFields {
  docNumber: string;
  date: string;
  ncf: string;
  rnc: string;
  ncfType: string;
  clientName: string;
  clientCedula: string;
  clientPhone: string;
  projectName: string;
  cotRef: string;
  items: LineItem[];
  subtotal: number;
  itbis: number;
  total: number;
  paymentMethod: string;
  dueDate: string;
  bankName: string;
  bankAccount: string;
}

// ── 03 · REC — Recibo de Pago ─────────────────────────────────────────────
export interface RecFields {
  docNumber: string;
  date: string;
  clientName: string;
  amount: number;
  amountWords: string;
  concept: string;
  facRef: string;
  reference: string;
  paymentMethod: string;
  bankConfirmation: string;
  balanceNote: string;
}

// ── 04 · SOW — Alcance de Trabajo ────────────────────────────────────────
export interface SowFields {
  docNumber: string;
  date: string;
  clientName: string;
  clientCedula: string;
  clientPhone: string;
  projectName: string;
  address1: string;
  address2: string;
  cotRef: string;
  startDate: string;
  endDate: string;
  scopeIncluded: string[];
  scopeExcluded: string[];
  tranches: PaymentTranche[];
  warrantyText: string;
}

// ── 05 · OT — Orden de Trabajo ───────────────────────────────────────────
export interface OtTask {
  description: string;
  responsible: string;
  days: string;
  status: BadgeStatus;
}

export interface OtFields {
  docNumber: string;
  date: string;
  clientName: string;
  clientCedula: string;
  projectName: string;
  address1: string;
  address2: string;
  technician: string;
  supervisor: string;
  startDate: string;
  estimatedDelivery: string;
  sowRef: string;
  status?: BadgeStatus;
  tasks: OtTask[];
  materials: string;
  observations: string;
}

// ── 06 · GANTT — Cronograma de Obra ──────────────────────────────────────
export interface GanttFields {
  docNumber: string;
  period: string;
  projectName: string;
  clientName: string;
  sowRef: string;
  phases: GanttPhase[];
}

// ── 07 · REG — Registro de Proyectos ─────────────────────────────────────
export interface RegRow {
  ref: string;
  client: string;
  project: string;
  status: BadgeStatus;
  startDate: string;
  endDate: string;
  amount: number;
}

export interface RegFields {
  docNumber: string;
  updatedDate: string;
  rows: RegRow[];
}

// ── 08 · OC — Orden de Cambio ─────────────────────────────────────────────
export interface OcFields {
  docNumber: string;
  date: string;
  clientName: string;
  projectName: string;
  sowRef: string;
  requestedBy: string;
  changeDescription: string;
  justification: string;
  items: LineItem[];
  subtotal: number;
  itbis: number;
  total: number;
  originalContractAmount: number;
  additionalDays: string;
  newDeliveryDate: string;
  terms: string;
}

// ── 09 · AE — Acta de Entrega ────────────────────────────────────────────
export interface AeFields {
  docNumber: string;
  date: string;
  clientName: string;
  clientCedula: string;
  projectName: string;
  address1: string;
  address2: string;
  sowRef: string;
  startDate: string;
  deliveryDate: string;
  executedWorks: string[];
  deliverables: string[];
  totalContract: number;
  paid: number;
  balance: number;
  warrantyText: string;
  clientObservations: string;
}

// ── 10 · PL — Punch List ─────────────────────────────────────────────────
export interface PlFields {
  docNumber: string;
  walkthroughDate: string;
  clientName: string;
  projectName: string;
  sowRef: string;
  walkthroughBy: string;
  targetCloseDate: string;
  items: PunchItem[];
  observations: string;
}

// ── 11 · RD — Reporte Diario ─────────────────────────────────────────────
export interface RdPersonnel {
  name: string;
  role: string;
  entry: string;
  exit: string;
  hours: number;
}

export interface RdFields {
  docNumber: string;
  date: string;
  projectName: string;
  otRef: string;
  dayOf: string;
  supervisor: string;
  weather: string;
  personnel: RdPersonnel[];
  worksDone: string[];
  materialsReceived: string[];
  incidents: string;
  progressPercent: string;
  daysElapsed: string;
  scheduleStatus: BadgeStatus;
  planTomorrow: string;
}

// ── 12 · VT — Visita Técnica ──────────────────────────────────────────────
export interface VtMeasurement {
  space: string;
  length: string;
  width: string;
  height: string;
  area: number;
}

export interface VtFields {
  docNumber: string;
  date: string;
  clientName: string;
  clientPhone: string;
  clientEmail: string;
  clientCedula: string;
  address1: string;
  address2: string;
  propertyType: string;
  area: string;
  constructionYear: string;
  clientType: string;
  areasToIntervene: Array<{ label: string; checked: boolean }>;
  currentCondition: string;
  requestedWorks: string[];
  measurements: VtMeasurement[];
  clientReferences: string;
  logisticsRestrictions: string;
  estimatedRange: string;
  estimatedDuration: string;
  possibleStart: string;
  nextSteps: string;
}

// ── 13 · CS — Contrato de Servicios ──────────────────────────────────────
export interface CsClause {
  title: string;
  body: string;
}

export interface CsFields {
  docNumber: string;
  date: string;
  projectName: string;
  projectAddress: string;
  sowRef: string;
  contractorName: string;
  contractorId: string;
  contractorAddress: string;
  contracteeName: string;
  contracteeRep: string;
  contracteeId: string;
  contracteeRnc: string;
  contracteeAddress: string;
  clauses: CsClause[];
  closingText: string;
}

// ── 14 · PV — Propuesta Visual ───────────────────────────────────────────
export interface PvApproach {
  code: string;
  title: string;
  body: string;
}

export interface PvPhase {
  number: string;
  phase: string;
  keyWorks: string;
  weeks: string;
  investment: number;
}

export interface PvFields {
  docNumber: string;
  date: string;
  clientName: string;
  clientLocation: string;
  projectName: string;
  projectSize: string;
  tagline: string;
  subtitle: string;
  executiveSummary: string;
  pullQuote: string;
  approaches: PvApproach[];
  phases: PvPhase[];
  totalInvestment: number;
  whyKanan: Array<{ number: string; title: string; body: string }>;
  ctaTagline: string;
  ctaBody: string;
  validity: string;
  reserveCondition: string;
  contactPhone: string;
}

// ── 15 · GR — Carta de Garantía ──────────────────────────────────────────
export interface GrFields {
  docNumber: string;
  date: string;
  clientName: string;
  clientCedula: string;
  projectName: string;
  address1: string;
  address2: string;
  sowRef: string;
  aeRef: string;
  warrantyStart: string;
  warrantyEnd: string;
  coveragePeriodText: string;
  worksCovered: string[];
  exclusions: string[];
  claimProcess: string;
  signatoryName: string;
  rnc: string;
}

// ── 16 · EC — Estado de Cuenta ───────────────────────────────────────────
export interface EcMovement {
  date: string;
  concept: string;
  document: string;
  charge: number | null;
  credit: number | null;
  balance: number;
}

export interface EcFields {
  docNumber: string;
  cutDate: string;
  clientName: string;
  clientCedula: string;
  projectName: string;
  sowRef: string;
  totalContracted: number;
  totalPaid: number;
  balance: number;
  nextDueDate: string;
  movements: EcMovement[];
  nextCharge: { concept: string; amount: number; dueDate: string };
  paymentNote: string;
}

// ── 17 · ES — Encuesta de Satisfacción ───────────────────────────────────
export interface EsRating {
  aspect: string;
  score: 1 | 2 | 3 | 4 | 5;
}

export interface EsFields {
  docNumber: string;
  date: string;
  clientName: string;
  clientCedula: string;
  projectAndDate: string;
  ratings: EsRating[];
  bestThings: string;
  improvements: string;
  wouldRecommend: 'yes' | 'maybe' | 'no';
  testimonialConsent: 'named' | 'anonymous' | 'no';
  testimonial: string;
}

// ── 18 · HT — Hoja de Tiempo ─────────────────────────────────────────────
export interface HtFields {
  docNumber: string;
  date?: string;
  weekRange: string;
  projectName: string;
  supervisor: string;
  period: string;
  paymentStatus?: string;
  rows: TimesheetRow[];
  totalDaysPerson: number;
  totalPayroll: number;
  observations: string;
  paymentMethod: string;
  paymentDate: string;
  paymentTime: string;
}

// ── 19 · RM — Requisición de Materiales ──────────────────────────────────
export interface RmItem {
  number: number;
  description: string;
  spec: string;
  unit: string;
  qty: number;
  refPrice: number;
  subtotal: number;
}

export interface RmFields {
  docNumber: string;
  date: string;
  supplierName: string;
  supplierAddress: string;
  supplierContact: string;
  requestedBy: string;
  authorizedBy: string;
  otRef: string;
  projectName: string;
  urgency: string;
  deliveryMethod: string;
  paymentTerms: string;
  items: RmItem[];
  subtotal: number;
  itbis: number;
  total: number;
  dispatchInstructions: string;
  authorizedBudget: number;
  thisRequisition: number;
  remainingMargin: number;
}

// ── 20 · AR — Acta de Reunión ─────────────────────────────────────────────
export interface ArDecision {
  description: string;
  justification: string;
}

export interface ArFields {
  docNumber: string;
  dateTime: string;
  projectName: string;
  clientName: string;
  location: string;
  duration: string;
  attendees: MeetingAttendee[];
  agenda: string[];
  decisions: ArDecision[];
  actionItems: ActionItem[];
  nextMeeting: { date: string; modality: string; topic: string };
}

// ── Union de todos los fields ──────────────────────────────────────────────
export type DocumentFields =
  | CotFields | FacFields | RecFields | SowFields | OtFields
  | GanttFields | RegFields | OcFields | AeFields | PlFields
  | RdFields | VtFields | CsFields | PvFields | GrFields
  | EcFields | EsFields | HtFields | RmFields | ArFields;

// ── Documento guardado en MongoDB ─────────────────────────────────────────
export interface KananDocument {
  _id: string;
  templateId: TemplateId;
  title: string;
  projectId?: string;
  clientId?: string;
  theme: ThemeMode;
  fields: DocumentFields;
  createdAt: string;
  updatedAt: string;
}
