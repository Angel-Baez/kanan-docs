# Product Requirements Document — KANAN Docs

**Versión:** 1.0  
**Fecha:** Abril 2026  
**Producto:** kanan-docs  
**Empresa:** KANAN Remodelaciones  

---

## 1. Visión del producto

KANAN Docs es un sistema interno de gestión de documentos operacionales para KANAN Remodelaciones, empresa de construcción y remodelación en República Dominicana. El sistema permite generar, editar, almacenar y exportar todos los documentos que acompañan el ciclo de vida completo de un proyecto de obra — desde la visita técnica inicial hasta la factura final — con identidad visual corporativa consistente.

---

## 2. Problema a resolver

Las empresas de construcción en RD gestionan decenas de documentos por proyecto (cotizaciones, contratos, reportes diarios, facturas, recibos) de forma manual, en Word o Excel, sin numeración automática, sin historial y con formatos inconsistentes. Esto genera:

- Errores de versión y documentos duplicados
- Pérdida de tiempo re-formateando documentos para cada cliente
- Dificultad para rastrear el estado financiero de un proyecto
- Imagen poco profesional ante el cliente

---

## 3. Usuarios objetivo

| Perfil | Necesidad principal |
|--------|---------------------|
| Director de operaciones | Supervisar todos los proyectos activos y su documentación |
| Supervisor de obra | Generar reportes diarios, hojas de tiempo y órdenes de trabajo |
| Área comercial | Crear cotizaciones, propuestas visuales y contratos |
| Área administrativa | Emitir facturas, recibos y estados de cuenta |

---

## 4. Alcance del MVP

### 4.1 Gestión de documentos

- Crear documentos a partir de 20 plantillas predefinidas
- Editar campos directamente en una vista de formulario + preview del documento
- Guardar automáticamente en base de datos (MongoDB)
- Eliminar documentos con confirmación
- Numeración automática por tipo (`COT-2026-0001`, `FAC-2026-0001`, etc.)

### 4.2 Plantillas por fase de proyecto

| Fase | Plantillas |
|------|-----------|
| **Pre-venta** | VT · Visita Técnica, PV · Propuesta Visual, COT · Cotización |
| **Contratación** | SOW · Alcance de Trabajo, CS · Contrato de Servicios |
| **Planificación** | GANTT · Cronograma de Obra, OT · Orden de Trabajo |
| **En obra** | RD · Reporte Diario, RM · Requisición de Materiales, HT · Hoja de Tiempo, AR · Acta de Reunión, OC · Orden de Cambio, PL · Punch List |
| **Cierre** | AE · Acta de Entrega, GR · Carta de Garantía, ES · Encuesta de Satisfacción |
| **Cobro** | FAC · Factura, REC · Recibo de Pago, EC · Estado de Cuenta |
| **Admin** | REG · Registro de Proyectos |

### 4.3 Búsqueda y organización

- Búsqueda en tiempo real por título, cliente o nombre de proyecto
- Filtrado lateral por cliente
- Vista en grilla (plana) o agrupada por cliente/proyecto
- Ordenamiento cronológico por última modificación

### 4.4 Exportación PDF

- Generación de PDF con Puppeteer (server-side rendering)
- PDF fiel al diseño visual del documento en pantalla

### 4.5 Identidad visual

- Sistema de temas: `base`, `t`, `o` (Olivo), `plena`
- Paleta corporativa KANAN: terracota, olivo, carbon, crema, piedra
- Logos SVG en variantes horizontal, vertical y símbolo

---

## 5. Requisitos funcionales

### RF-01 — Listado de documentos
- El sistema muestra todos los documentos guardados
- Cada tarjeta muestra: tipo de documento, número, cliente, proyecto y fecha de modificación
- Estado vacío con CTA para crear el primer documento

### RF-02 — Crear documento
- Modal con plantillas organizadas por fase
- Al seleccionar, crea el documento con campos por defecto y redirige al editor
- Numeración incremental automática por tipo en el año en curso

### RF-03 — Editor de documento
- Panel izquierdo: formulario con todos los campos del template
- Panel derecho: preview del documento con identidad KANAN
- Guardado automático o manual (definir)
- Cambio de tema (ThemeSwitcher)

### RF-04 — Eliminar documento
- Botón visible al hacer hover sobre la tarjeta
- Diálogo de confirmación antes de eliminar
- Eliminación permanente (no hay papelera)

### RF-05 — Exportar PDF
- Botón "Exportar PDF" en el editor
- El backend usa Puppeteer para renderizar el documento y devolver el archivo

### RF-06 — Búsqueda y filtros
- Input de búsqueda con debounce en el listado
- Sidebar de clientes únicos para filtrar
- Toggle entre vista grilla y vista agrupada por proyecto

### RF-07 — Cumplimiento fiscal RD
- Facturas incluyen NCF (Número de Comprobante Fiscal) y tipo de NCF
- Cálculo de ITBIS (18%) en documentos con totales
- Campo RNC en facturas y contratos

---

## 6. Requisitos no funcionales

| Categoría | Requisito |
|-----------|-----------|
| **Performance** | El listado debe cargar en < 1 s con hasta 500 documentos |
| **Seguridad** | API sin autenticación en MVP (red interna); añadir auth en v1.1 |
| **Disponibilidad** | Uso interno; uptime best-effort |
| **Persistencia** | MongoDB local o Atlas; backup manual en MVP |
| **Portabilidad** | Deploya en cualquier VPS Linux con Node 20+ |

---

## 7. Arquitectura técnica

```
kanan-docs/
├── apps/
│   ├── web/          React 18 + Vite + TypeScript + Tailwind
│   └── api/          Express + TypeScript + MongoDB (Mongoose) + Puppeteer
└── packages/
    └── shared/       Tipos TypeScript compartidos (@kanan/shared)
```

**API REST base path:** `/api/v1/`

| Recurso | Endpoints |
|---------|-----------|
| Documentos | `GET /documents`, `POST /documents`, `GET /documents/:id`, `PUT /documents/:id`, `DELETE /documents/:id` |
| Clientes | `GET /clients`, `POST /clients`, `GET /clients/:id` |
| Proyectos | `GET /projects`, `POST /projects`, `GET /projects/:id` |
| Health | `GET /api/health` |

---

## 8. Modelo de datos principal

```typescript
interface KananDocument {
  _id: string;
  templateId: TemplateId;   // 'cot' | 'fac' | 'rec' | ... (20 tipos)
  title: string;            // número de documento, e.g. "COT-2026-0001"
  projectId?: string;
  clientId?: string;
  theme: 'base' | 't' | 'o' | 'plena';
  fields: DocumentFields;   // union de todos los campos por template
  createdAt: string;
  updatedAt: string;
}
```

---

## 9. Roadmap

### v1.0 — MVP (actual)
- [x] 20 plantillas de documentos
- [x] CRUD completo de documentos
- [x] Búsqueda y filtrado
- [x] Vista grilla y agrupada
- [x] Exportación PDF (Puppeteer)
- [x] Identidad visual KANAN con temas

### v1.1 — Autenticación y multi-usuario
- [ ] Login con JWT (usuarios internos KANAN)
- [ ] Roles: admin, supervisor, comercial
- [ ] Documentos propios vs. todos los documentos

### v1.2 — Vinculación entre documentos
- [ ] Campo de referencia cruzada operativo (COT → FAC → REC)
- [ ] Vista de proyecto con todos sus documentos relacionados
- [ ] Timeline del proyecto

### v1.3 — Clientes y proyectos como entidades
- [ ] CRUD de clientes con historial de documentos
- [ ] CRUD de proyectos con estado y métricas
- [ ] Dashboard con proyectos activos y alertas de cobro

### v2.0 — Portal cliente
- [ ] Link de solo lectura por documento para enviar al cliente
- [ ] Firma digital del cliente (e-signature)
- [ ] Notificaciones por WhatsApp/email al cliente

---

## 10. Criterios de aceptación del MVP

- [ ] Un usuario puede crear un documento de cualquiera de los 20 tipos en < 30 segundos
- [ ] Los campos del formulario se reflejan en tiempo real en el preview
- [ ] El PDF exportado es visualmente idéntico al preview en pantalla
- [ ] La búsqueda filtra resultados mientras el usuario escribe
- [ ] Las facturas incluyen NCF y cálculo de ITBIS correcto
- [ ] El sistema funciona offline-first (MongoDB local en MVP)

---

## 11. Métricas de éxito

| Métrica | Meta |
|---------|------|
| Tiempo para generar una cotización | < 5 minutos (vs. 30 min. en Word) |
| Documentos creados/mes | > 50 en el primer mes de uso real |
| Errores de numeración/duplicados | 0 |
| Adopción del equipo | 100% de operaciones documentadas en el sistema |
