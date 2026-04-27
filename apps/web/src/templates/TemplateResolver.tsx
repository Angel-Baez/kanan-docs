import type { TemplateId } from '@kanan/shared';
import { CotizacionDoc } from './CotizacionDoc.tsx';
import { FacturaDoc } from './FacturaDoc.tsx';
import { ReciboDoc } from './ReciboDoc.tsx';
import { SowDoc } from './SowDoc.tsx';
import { OrdenTrabajoDoc } from './OrdenTrabajoDoc.tsx';
import { GanttDoc } from './GanttDoc.tsx';
import { RegistroDoc } from './RegistroDoc.tsx';
import { OrdenCambioDoc } from './OrdenCambioDoc.tsx';
import { ActaEntregaDoc } from './ActaEntregaDoc.tsx';
import { PunchListDoc } from './PunchListDoc.tsx';
import { ReporteDiarioDoc } from './ReporteDiarioDoc.tsx';
import { VisitaTecnicaDoc } from './VisitaTecnicaDoc.tsx';
import { ContratoServiciosDoc } from './ContratoServiciosDoc.tsx';
import { PropuestaVisualDoc } from './PropuestaVisualDoc.tsx';
import { CartaGarantiaDoc } from './CartaGarantiaDoc.tsx';
import { EstadoCuentaDoc } from './EstadoCuentaDoc.tsx';
import { EncuestaDoc } from './EncuestaDoc.tsx';
import { HojaTiempoDoc } from './HojaTiempoDoc.tsx';
import { RequisicionDoc } from './RequisicionDoc.tsx';
import { ActaReunionDoc } from './ActaReunionDoc.tsx';

const COMPONENTS: Record<TemplateId, () => JSX.Element> = {
  cot:   CotizacionDoc,
  fac:   FacturaDoc,
  rec:   ReciboDoc,
  sow:   SowDoc,
  ot:    OrdenTrabajoDoc,
  gantt: GanttDoc,
  reg:   RegistroDoc,
  oc:    OrdenCambioDoc,
  ae:    ActaEntregaDoc,
  pl:    PunchListDoc,
  rd:    ReporteDiarioDoc,
  vt:    VisitaTecnicaDoc,
  cs:    ContratoServiciosDoc,
  pv:    PropuestaVisualDoc,
  gr:    CartaGarantiaDoc,
  ec:    EstadoCuentaDoc,
  es:    EncuestaDoc,
  ht:    HojaTiempoDoc,
  rm:    RequisicionDoc,
  ar:    ActaReunionDoc,
};

interface TemplateResolverProps {
  templateId: TemplateId;
}

export function TemplateResolver({ templateId }: TemplateResolverProps) {
  const Component = COMPONENTS[templateId];
  if (!Component) {
    return <div style={{ padding: 40 }}>Template "{templateId}" no encontrado.</div>;
  }
  return <Component />;
}
