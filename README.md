# KANAN Docs

Sistema de gestión de documentos operacionales para **KANAN Remodelaciones**. Genera, edita y exporta los 20 tipos de documentos que acompañan el ciclo de vida completo de un proyecto de construcción — desde la visita técnica inicial hasta la factura final.

## Stack

| Capa | Tecnología |
|------|-----------|
| Frontend | React 18 · Vite · TypeScript · Tailwind CSS · Radix UI |
| Backend | Express · TypeScript · MongoDB (Mongoose) · Puppeteer |
| Shared | `@kanan/shared` — tipos TypeScript compartidos |
| Monorepo | npm workspaces · concurrently |

## Estructura

```
kanan-docs/
├── apps/
│   ├── web/          # SPA React (Vite)
│   └── api/          # API REST (Express)
└── packages/
    └── shared/       # Tipos compartidos (@kanan/shared)
```

## Requisitos

- Node.js 20+
- MongoDB 7+ (local o Atlas)

## Setup

```bash
# 1. Instalar dependencias
npm install

# 2. Configurar variables de entorno
cp apps/api/.env.example apps/api/.env
# Editar apps/api/.env con tu MONGODB_URI

# 3. Build del paquete compartido
npm run build:shared

# 4. Correr en desarrollo (API + Web simultáneamente)
npm run dev
```

La web queda en `http://localhost:5173` y la API en `http://localhost:3001`.

## Variables de entorno

`apps/api/.env`:

```env
MONGODB_URI=mongodb://localhost:27017/kanan-docs
PORT=3001
NODE_ENV=development
WEB_URL=http://localhost:5173
```

## Scripts

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Inicia API y Web en paralelo |
| `npm run build` | Build completo (shared → api → web) |
| `npm run build:shared` | Build solo del paquete shared |

## API

Base URL: `http://localhost:3001/api/v1`

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/documents` | Listar todos los documentos |
| POST | `/documents` | Crear documento |
| GET | `/documents/:id` | Obtener documento |
| PUT | `/documents/:id` | Actualizar documento |
| DELETE | `/documents/:id` | Eliminar documento |
| GET | `/clients` | Listar clientes |
| GET | `/projects` | Listar proyectos |
| GET | `/api/health` | Health check |

## Plantillas de documentos

Los 20 tipos están organizados por fase del proyecto:

| Fase | Código | Documento |
|------|--------|-----------|
| Pre-venta | VT | Visita Técnica |
| Pre-venta | PV | Propuesta Visual |
| Pre-venta | COT | Cotización |
| Contratación | SOW | Alcance de Trabajo |
| Contratación | CS | Contrato de Servicios |
| Planificación | GANTT | Cronograma de Obra |
| Planificación | OT | Orden de Trabajo |
| En obra | RD | Reporte Diario |
| En obra | RM | Requisición de Materiales |
| En obra | HT | Hoja de Tiempo |
| En obra | AR | Acta de Reunión |
| En obra | OC | Orden de Cambio |
| En obra | PL | Punch List |
| Cierre | AE | Acta de Entrega |
| Cierre | GR | Carta de Garantía |
| Cierre | ES | Encuesta de Satisfacción |
| Cobro | FAC | Factura |
| Cobro | REC | Recibo de Pago |
| Cobro | EC | Estado de Cuenta |
| Admin | REG | Registro de Proyectos |

## Agregar un template nuevo

1. Añadir el `TemplateId` en `packages/shared/src/types/document.ts`
2. Definir la interfaz de campos `XxxFields` en el mismo archivo
3. Crear el componente `XxxDoc.tsx` en `apps/web/src/templates/`
4. Registrar el template en `apps/web/src/templates/registry.ts` (metadata + defaultFields)
5. Añadirlo al resolver en `apps/web/src/templates/TemplateResolver.tsx`
6. Hacer build: `npm run build:shared`
