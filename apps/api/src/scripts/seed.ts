import "dotenv/config";
import mongoose from "mongoose";
import Client from "../models/Client.js";
import Document from "../models/Document.js";
import Project from "../models/Project.js";

// ─── Helpers ────────────────────────────────────────────────────────────────

function d(offset: number): string {
  const dt = new Date("2025-01-15");
  dt.setDate(dt.getDate() + offset);
  return dt.toISOString().slice(0, 10);
}

function fmt(isoDate: string): string {
  const [year, month = "01", day = "01"] = isoDate.split("-");
  const m = [
    "ENE",
    "FEB",
    "MAR",
    "ABR",
    "MAY",
    "JUN",
    "JUL",
    "AGO",
    "SEP",
    "OCT",
    "NOV",
    "DIC",
  ][parseInt(month) - 1];
  return `${parseInt(day)} · ${m} · ${year}`;
}

function docNum(prefix: string, n: number, isoDate?: string): string {
  const year = isoDate ? isoDate.slice(0, 4) : "2025";
  return `${prefix}-${year}-${String(n).padStart(4, "0")}`;
}

function lineItems(desc: string[], basePrice: number) {
  return desc.map((description, i) => {
    const qty = [1, 2, 1, 3, 1][i % 5];
    const unitPrice = Math.round(basePrice * (0.8 + i * 0.15));
    return {
      description,
      unit: ["m²", "gl", "und", "m²", "gl"][i % 5],
      qty,
      unitPrice,
      total: qty! * unitPrice,
    };
  });
}

function totals(items: ReturnType<typeof lineItems>) {
  const subtotal = items.reduce((s, x) => s + x.total, 0);
  const itbis = Math.round(subtotal * 0.18);
  return { subtotal, itbis, total: subtotal + itbis };
}

function numberToWords(num: number): string {
  const ones = [
    "",
    "uno",
    "dos",
    "tres",
    "cuatro",
    "cinco",
    "seis",
    "siete",
    "ocho",
    "nueve",
  ];
  const teens = [
    "diez",
    "once",
    "doce",
    "trece",
    "catorce",
    "quince",
    "dieciséis",
    "diecisiete",
    "dieciocho",
    "diecinueve",
  ];
  const tens = [
    "",
    "",
    "veinte",
    "treinta",
    "cuarenta",
    "cincuenta",
    "sesenta",
    "setenta",
    "ochenta",
    "noventa",
  ];
  const scales = ["", "mil", "millón", "mil millones", "billón"];

  if (num === 0) return "cero";

  function convertGroup(n: number): string {
    let result = "";

    // Centenas
    const hundreds = Math.floor(n / 100);
    if (hundreds > 0) {
      const hundredNames = [
        "",
        "ciento",
        "doscientos",
        "trescientos",
        "cuatrocientos",
        "quinientos",
        "seiscientos",
        "setecientos",
        "ochocientos",
        "novecientos",
      ];
      result += hundredNames[hundreds] + " ";
    }

    // Decenas y unidades
    const remainder = n % 100;
    if (remainder >= 10 && remainder < 20) {
      result += teens[remainder - 10] + " ";
    } else {
      const tens_digit = Math.floor(remainder / 10);
      const ones_digit = remainder % 10;

      if (tens_digit > 0) {
        result += tens[tens_digit] + " ";
        if (ones_digit > 0) result += "y ";
      }

      if (ones_digit > 0) {
        result += ones[ones_digit] + " ";
      }
    }

    return result.trim();
  }

  let words = "";
  let groupIndex = 0;
  let isFirstGroup = true;

  while (num > 0) {
    const group = num % 1000;

    if (group > 0) {
      let groupWords = convertGroup(group);

      // Aplicar reglas especiales para "mil"
      if (groupIndex === 1 && group === 1) {
        groupWords = "mil";
      } else if (groupIndex === 1) {
        groupWords += " mil";
      } else if (groupIndex > 1) {
        const scale = scales[groupIndex];
        if (group === 1 && groupIndex === 2) {
          groupWords = "un millón";
        } else {
          groupWords += ` ${scale}`;
        }
      }

      if (!isFirstGroup) {
        words = " " + words;
      }
      words = groupWords + words;
      isFirstGroup = false;
    }

    num = Math.floor(num / 1000);
    groupIndex++;
  }

  return words.trim();
}

function formatMoneyInWords(amount: number): string {
  const palabras = numberToWords(amount);
  return `${palabras.charAt(0).toUpperCase()}${palabras.slice(1)} pesos dominicanos`;
}

// ─── Client data ─────────────────────────────────────────────────────────────

const clientsData = [
  // 0 — 3 proyectos
  {
    name: "Familia Martínez",
    cedula: "001-1234567-8",
    phone: "809-555-0101",
    email: "martinez.familia@gmail.com",
    address1: "Calle Pasteur #45, Piantini",
    address2: "Santo Domingo, DN",
    type: "residencial" as const,
  },
  // 1 — 2 proyectos
  {
    name: "Corporación Estrella SRL",
    cedula: "101-23456-7",
    phone: "809-555-0202",
    email: "gerencia@estrellasrl.do",
    address1: "Av. Winston Churchill #200, Torre Empresarial, Piso 8",
    address2: "Santo Domingo, DN",
    type: "comercial" as const,
  },
  // 2 — 3 proyectos
  {
    name: "Familia Rodríguez",
    cedula: "001-9876543-2",
    phone: "809-555-0303",
    email: "rodriguez.hogar@hotmail.com",
    address1: "Av. Anacaona #78, Los Cacicazgos",
    address2: "Santo Domingo, DN",
    type: "residencial" as const,
  },
  // 3 — 2 proyectos
  {
    name: "Hotel Playa Azul",
    cedula: "130-45678-9",
    phone: "809-555-0404",
    email: "proyectos@playaazul.com.do",
    address1: "Carretera Mella Km 18, Boca Chica",
    address2: "Santo Domingo Este, DN",
    type: "comercial" as const,
  },
  // 4 — 1 proyecto
  {
    name: "Familia Núñez",
    cedula: "001-4567891-0",
    phone: "809-555-0505",
    email: "nunez.familia@yahoo.com",
    address1: "Calle El Recodo #12, Bella Vista",
    address2: "Santo Domingo, DN",
    type: "residencial" as const,
  },
  // 5 — 1 proyecto
  {
    name: "Clínica San Rafael",
    cedula: "401-12345-6",
    phone: "809-555-0606",
    email: "infraestructura@clinicasanrafael.do",
    address1: "Av. 27 de Febrero #350, Naco",
    address2: "Santo Domingo, DN",
    type: "institucional" as const,
  },
  // 6 — 2 proyectos
  {
    name: "Familia Pérez",
    cedula: "001-7891234-5",
    phone: "809-555-0707",
    email: "perez.construccion@gmail.com",
    address1: "Calle José Brea Peña #3, Evaristo Morales",
    address2: "Santo Domingo, DN",
    type: "residencial" as const,
  },
  // 7 — 1 proyecto
  {
    name: "Restaurant La Terraza",
    cedula: "101-98765-4",
    phone: "809-555-0808",
    email: "admin@laterraza.do",
    address1: "Calle El Conde #120, Zona Colonial",
    address2: "Santo Domingo, DN",
    type: "comercial" as const,
  },
  // 8 — 1 proyecto
  {
    name: "Familia Cabrera",
    cedula: "001-3698521-4",
    phone: "809-555-0909",
    email: "lcabrera@cabrera.com",
    address1: "Calle Gustavo Mejía Ricart #55, Serrallés",
    address2: "Santo Domingo, DN",
    type: "residencial" as const,
  },
  // 9 — 1 proyecto
  {
    name: "Ministerio de Educación",
    cedula: "401-00001-0",
    phone: "809-688-9700",
    email: "infraestructura@minerd.gob.do",
    address1: "Av. Máximo Gómez #31",
    address2: "Santo Domingo, DN",
    type: "institucional" as const,
  },
  // 10 — 1 proyecto
  {
    name: "Familia Guerrero",
    cedula: "001-2580369-7",
    phone: "809-555-1010",
    email: "guerrero.family@gmail.com",
    address1: "Calle Elvira de Mendoza #8, La Esperilla",
    address2: "Santo Domingo, DN",
    type: "residencial" as const,
  },
  // 11 — 1 proyecto
  {
    name: "Oficinas Torre Norte",
    cedula: "101-55566-7",
    phone: "809-555-1111",
    email: "admin@torrenorte.do",
    address1: "Av. John F. Kennedy #456, Torre Norte, Piso 12",
    address2: "Santo Domingo, DN",
    type: "comercial" as const,
  },
  // 12 — 1 proyecto
  {
    name: "Colegio San José",
    cedula: "401-33333-3",
    phone: "809-555-1212",
    email: "planta.fisica@colegiosanjose.do",
    address1: "Calle Hostos #92, Ciudad Nueva",
    address2: "Santo Domingo, DN",
    type: "institucional" as const,
  },
];

// ─── Project data (clientIndex references clientsData array) ──────────────────

interface ProjectDef {
  clientIndex: number;
  name: string;
  address1: string;
  address2: string;
  status: "cotizando" | "activo" | "completado" | "garantia";
  startDate?: string;
  endDate?: string;
  totalAmount: number;
  preferredTheme: "base" | "t" | "o" | "plena";
}

const projectsData: ProjectDef[] = [
  // ── COTIZANDO (5) ──────────────────────────────────────────────────────────
  {
    clientIndex: 0,
    name: "Remodelación Sala y Comedor",
    address1: "Calle Pasteur #45, Piantini",
    address2: "Santo Domingo, DN",
    status: "cotizando",
    totalAmount: 680_000,
    preferredTheme: "o",
  },
  {
    clientIndex: 1,
    name: "Lobby Corporativo",
    address1: "Av. Winston Churchill #200, Torre Empresarial",
    address2: "Santo Domingo, DN",
    status: "cotizando",
    totalAmount: 2_400_000,
    preferredTheme: "plena",
  },
  {
    clientIndex: 3,
    name: "Suite Presidencial",
    address1: "Carretera Mella Km 18, Boca Chica",
    address2: "Santo Domingo Este, DN",
    status: "cotizando",
    totalAmount: 3_150_000,
    preferredTheme: "t",
  },
  {
    clientIndex: 9,
    name: "Oficinas Regionales – Sede Norte",
    address1: "Av. Máximo Gómez #31",
    address2: "Santo Domingo, DN",
    status: "cotizando",
    totalAmount: 8_900_000,
    preferredTheme: "base",
  },
  {
    clientIndex: 10,
    name: "Terraza y Jardín Exterior",
    address1: "Calle Elvira de Mendoza #8, La Esperilla",
    address2: "Santo Domingo, DN",
    status: "cotizando",
    totalAmount: 420_000,
    preferredTheme: "o",
  },

  // ── ACTIVO (7) ────────────────────────────────────────────────────────────
  {
    clientIndex: 0,
    name: "Cocina Integral y Cuarto de Servicio",
    address1: "Calle Pasteur #45, Piantini",
    address2: "Santo Domingo, DN",
    status: "activo",
    startDate: d(-45),
    totalAmount: 950_000,
    preferredTheme: "o",
  },
  {
    clientIndex: 1,
    name: "Oficinas Ejecutivas Piso 8",
    address1: "Av. Winston Churchill #200, Torre Empresarial, Piso 8",
    address2: "Santo Domingo, DN",
    status: "activo",
    startDate: d(-30),
    totalAmount: 4_200_000,
    preferredTheme: "plena",
  },
  {
    clientIndex: 2,
    name: "Master Suite y Vestidor",
    address1: "Av. Anacaona #78, Los Cacicazgos",
    address2: "Santo Domingo, DN",
    status: "activo",
    startDate: d(-60),
    totalAmount: 1_350_000,
    preferredTheme: "o",
  },
  {
    clientIndex: 3,
    name: "Área de Piscina y Bar Externo",
    address1: "Carretera Mella Km 18, Boca Chica",
    address2: "Santo Domingo Este, DN",
    status: "activo",
    startDate: d(-90),
    totalAmount: 6_800_000,
    preferredTheme: "t",
  },
  {
    clientIndex: 5,
    name: "Sala de Espera y Recepción",
    address1: "Av. 27 de Febrero #350, Naco",
    address2: "Santo Domingo, DN",
    status: "activo",
    startDate: d(-20),
    totalAmount: 1_750_000,
    preferredTheme: "base",
  },
  {
    clientIndex: 8,
    name: "Apartamento Completo – 3 Niveles",
    address1: "Calle Gustavo Mejía Ricart #55, Serrallés",
    address2: "Santo Domingo, DN",
    status: "activo",
    startDate: d(-75),
    totalAmount: 5_600_000,
    preferredTheme: "o",
  },
  {
    clientIndex: 11,
    name: "Open Space y Sala de Conferencias",
    address1: "Av. John F. Kennedy #456, Torre Norte, Piso 12",
    address2: "Santo Domingo, DN",
    status: "activo",
    startDate: d(-15),
    totalAmount: 3_300_000,
    preferredTheme: "plena",
  },

  // ── COMPLETADO (5) ────────────────────────────────────────────────────────
  {
    clientIndex: 2,
    name: "Sala Principal y Área Social",
    address1: "Av. Anacaona #78, Los Cacicazgos",
    address2: "Santo Domingo, DN",
    status: "completado",
    startDate: d(-180),
    endDate: d(-30),
    totalAmount: 1_100_000,
    preferredTheme: "o",
  },
  {
    clientIndex: 4,
    name: "Remodelación de Baños",
    address1: "Calle El Recodo #12, Bella Vista",
    address2: "Santo Domingo, DN",
    status: "completado",
    startDate: d(-120),
    endDate: d(-45),
    totalAmount: 340_000,
    preferredTheme: "o",
  },
  {
    clientIndex: 6,
    name: "Cuarto Principal con Baño en Suite",
    address1: "Calle José Brea Peña #3, Evaristo Morales",
    address2: "Santo Domingo, DN",
    status: "completado",
    startDate: d(-200),
    endDate: d(-60),
    totalAmount: 780_000,
    preferredTheme: "t",
  },
  {
    clientIndex: 7,
    name: "Interiorismo Salón Principal",
    address1: "Calle El Conde #120, Zona Colonial",
    address2: "Santo Domingo, DN",
    status: "completado",
    startDate: d(-150),
    endDate: d(-20),
    totalAmount: 2_200_000,
    preferredTheme: "plena",
  },
  {
    clientIndex: 12,
    name: "Aulas y Biblioteca Central",
    address1: "Calle Hostos #92, Ciudad Nueva",
    address2: "Santo Domingo, DN",
    status: "completado",
    startDate: d(-240),
    endDate: d(-90),
    totalAmount: 12_500_000,
    preferredTheme: "base",
  },

  // ── GARANTIA (3) ──────────────────────────────────────────────────────────
  {
    clientIndex: 0,
    name: "Baño Principal y Jacuzzi",
    address1: "Calle Pasteur #45, Piantini",
    address2: "Santo Domingo, DN",
    status: "garantia",
    startDate: d(-365),
    endDate: d(-200),
    totalAmount: 520_000,
    preferredTheme: "o",
  },
  {
    clientIndex: 2,
    name: "Cocina y Área de Comedor",
    address1: "Av. Anacaona #78, Los Cacicazgos",
    address2: "Santo Domingo, DN",
    status: "garantia",
    startDate: d(-400),
    endDate: d(-250),
    totalAmount: 890_000,
    preferredTheme: "o",
  },
  {
    clientIndex: 6,
    name: "Sala de Estar y Pasillo Central",
    address1: "Calle José Brea Peña #3, Evaristo Morales",
    address2: "Santo Domingo, DN",
    status: "garantia",
    startDate: d(-320),
    endDate: d(-180),
    totalAmount: 450_000,
    preferredTheme: "t",
  },
];

// ─── Document builders ───────────────────────────────────────────────────────

interface ProjectCtx {
  projectName: string;
  clientName: string;
  clientCedula: string;
  clientPhone: string;
  clientEmail: string;
  address1: string;
  address2: string;
  totalAmount: number;
  startDate: string;
  endDate: string;
  idx: number; // project sequential index for unique doc numbers
}

function buildVt(ctx: ProjectCtx) {
  const date = d(-ctx.idx * 3 - 10);
  return {
    templateId: "vt",
    title: `Visita Técnica – ${ctx.projectName}`,
    fields: {
      docNumber: docNum("VT", ctx.idx * 10 + 1, date),
      date: fmt(date),
      clientName: ctx.clientName,
      clientPhone: ctx.clientPhone,
      clientEmail: ctx.clientEmail,
      clientCedula: ctx.clientCedula,
      address1: ctx.address1,
      address2: ctx.address2,
      projectName: ctx.projectName,
      propertyType: [
        "Apartamento",
        "Casa",
        "Local Comercial",
        "Oficina",
        "Edificio",
      ][ctx.idx % 5],
      area: `${80 + ctx.idx * 15} m²`,
      constructionYear: String(2005 + (ctx.idx % 18)),
      clientType: ["Propietario", "Administrador", "Representante"][
        ctx.idx % 3
      ],
      areasToIntervene: [
        { label: "Sala", checked: true },
        { label: "Comedor", checked: ctx.idx % 2 === 0 },
        { label: "Cocina", checked: ctx.idx % 3 !== 0 },
        { label: "Habitación Principal", checked: ctx.idx % 2 !== 0 },
        { label: "Baño", checked: true },
        { label: "Terraza", checked: ctx.idx % 4 === 0 },
      ],
      currentCondition:
        "Regular. Superficies con desgaste visible, instalaciones eléctricas y sanitarias funcionales pero desactualizadas.",
      requestedWorks: [
        "Demolición y retiro de materiales existentes",
        "Nivelación y preparación de superficies",
        "Instalación de nuevos revestimientos",
        "Pintura general",
      ],
      measurements: [
        {
          space: "Sala",
          length: "5.5",
          width: "4.2",
          height: "2.7",
          area: 23.1,
        },
        {
          space: "Comedor",
          length: "3.8",
          width: "3.5",
          height: "2.7",
          area: 13.3,
        },
        {
          space: "Cocina",
          length: "3.2",
          width: "2.8",
          height: "2.7",
          area: 8.96,
        },
      ],
      clientReferences:
        "Trabajo visto en casa de vecino. Buenas referencias del equipo.",
      logisticsRestrictions:
        "Acceso por escalera interior. Horario limitado 8am–5pm de L–V.",
      estimatedRange: `RD$${Math.round(ctx.totalAmount * 0.9).toLocaleString()} – RD$${ctx.totalAmount.toLocaleString()}`,
      estimatedDuration: `${4 + ctx.idx * 2} semanas`,
      possibleStart: fmt(d(-ctx.idx * 3 - 5)),
      nextSteps: "Enviar cotización detallada en 3–5 días hábiles.",
    },
  };
}

function buildCot(ctx: ProjectCtx) {
  const date = d(-ctx.idx * 3 - 7);
  const items = lineItems(
    [
      "Demolición y desalojo",
      "Instalación de porcelanato",
      "Trabajos de pintura",
      "Instalaciones sanitarias",
    ],
    Math.round(ctx.totalAmount / 5),
  );
  const { subtotal, itbis, total } = totals(items);
  return {
    templateId: "cot",
    title: `Cotización – ${ctx.projectName}`,
    fields: {
      docNumber: docNum("COT", ctx.idx * 10 + 2, date),
      date: fmt(date),
      validUntil: fmt(d(-ctx.idx * 3 + 23)),
      clientName: ctx.clientName,
      clientPhone: ctx.clientPhone,
      clientEmail: ctx.clientEmail,
      projectName: ctx.projectName,
      address1: ctx.address1,
      address2: ctx.address2,
      vtRef: docNum("VT", ctx.idx * 10 + 1, d(-ctx.idx * 3 - 10)),
      items,
      subtotal,
      itbis,
      total,
      conditions:
        "50% al inicio, 30% a mitad de obra, 20% a la entrega. Validez 30 días. Materiales incluidos salvo indicación contraria.",
    },
  };
}

function buildPv(ctx: ProjectCtx) {
  const date = d(-ctx.idx * 3 - 6);
  return {
    templateId: "pv",
    title: `Propuesta Visual – ${ctx.projectName}`,
    fields: {
      docNumber: docNum("PV", ctx.idx * 10 + 3, date),
      date: fmt(date),
      clientName: ctx.clientName,
      clientLocation: ctx.address1,
      projectName: ctx.projectName,
      projectSize: `${80 + ctx.idx * 15} m²`,
      tagline: "Espacios que inspiran, diseños que perduran.",
      subtitle: "Propuesta de diseño y remodelación integral",
      executiveSummary:
        `Presentamos una propuesta integral para la remodelación de ${ctx.projectName}, ` +
        "enfocada en optimizar los espacios, elevar la estética y garantizar durabilidad con materiales de primera calidad.",
      pullQuote: "Cada espacio cuenta una historia. La tuya comienza aquí.",
      approaches: [
        {
          code: "A",
          title: "Clásico Atemporal",
          body: "Paleta neutra con acentos en madera natural y mármol. Estética sofisticada y duradera.",
        },
        {
          code: "B",
          title: "Contemporáneo Minimalista",
          body: "Líneas limpias, tonos claros y materiales de alto contraste. Funcionalidad y elegancia en balance.",
        },
      ],
      phases: [
        {
          number: "1",
          phase: "Demolición y preparación",
          keyWorks: "Retiro de materiales, nivelación",
          weeks: "2",
          investment: Math.round(ctx.totalAmount * 0.15),
        },
        {
          number: "2",
          phase: "Obra civil e instalaciones",
          keyWorks: "Plomería, electricidad, tabiques",
          weeks: "3",
          investment: Math.round(ctx.totalAmount * 0.35),
        },
        {
          number: "3",
          phase: "Acabados y detalles",
          keyWorks: "Revestimientos, pintura, carpintería",
          weeks: "3",
          investment: Math.round(ctx.totalAmount * 0.35),
        },
        {
          number: "4",
          phase: "Entrega y garantía",
          keyWorks: "Punch list, limpieza, documentación",
          weeks: "1",
          investment: Math.round(ctx.totalAmount * 0.15),
        },
      ],
      totalInvestment: ctx.totalAmount,
      whyKanan: [
        {
          number: "01",
          title: "Experiencia probada",
          body: "+8 años ejecutando proyectos residenciales y comerciales en Santo Domingo.",
        },
        {
          number: "02",
          title: "Transparencia total",
          body: "Reportes semanales, acceso a materiales y costos en tiempo real.",
        },
        {
          number: "03",
          title: "Garantía de calidad",
          body: "1 año de garantía en mano de obra sobre todos los trabajos ejecutados.",
        },
      ],
      ctaTagline: "¿Listo para transformar tu espacio?",
      ctaBody:
        "Agenda tu reunión de cierre y asegura tu fecha de inicio con un 10% de reserva.",
      validity: "30 días",
      reserveCondition:
        "10% del total contratado para reservar fecha de inicio",
      contactPhone: "809-555-0001",
    },
  };
}

function buildCs(ctx: ProjectCtx) {
  return {
    templateId: "cs",
    title: `Contrato de Servicios – ${ctx.projectName}`,
    fields: {
      docNumber: docNum("CS", ctx.idx * 10 + 4, ctx.startDate),
      date: fmt(ctx.startDate),
      projectName: ctx.projectName,
      projectAddress: `${ctx.address1}, ${ctx.address2}`,
      sowRef: docNum("SOW", ctx.idx * 10 + 5, ctx.startDate),
      contractorName: "Kanan Construcciones SRL",
      contractorId: "131-00001-1",
      contractorAddress: "Calle Fantino Falco #15, Piantini, Santo Domingo, DN",
      contracteeName: ctx.clientName,
      contracteeRep: ctx.clientName,
      contracteeId: ctx.clientCedula,
      contracteeRnc: ctx.clientCedula,
      contracteeAddress: `${ctx.address1}, ${ctx.address2}`,
      clauses: [
        {
          title: "Objeto del Contrato",
          body: `EL CONTRATISTA se obliga a ejecutar para EL CONTRATANTE los trabajos de remodelación de ${ctx.projectName} descritos en el Alcance de Trabajo anexo, identificado como ${docNum("SOW", ctx.idx * 10 + 5, ctx.startDate)}, el cual forma parte integral de este contrato.`,
        },
        {
          title: "Alcance",
          body: `El alcance, materiales, especificaciones técnicas y trabajos no incluidos están detallados en el ${docNum("SOW", ctx.idx * 10 + 5, ctx.startDate)} anexo. Cualquier trabajo fuera de este alcance requerirá una Orden de Cambio firmada por ambas partes antes de su ejecución.`,
        },
        {
          title: "Plazo de Ejecución",
          body: `Los trabajos iniciarán el ${fmt(ctx.startDate)} y se estima una duración de ${6 + ctx.idx * 2} semanas, sujetos a las condiciones establecidas en este contrato y a eventos de fuerza mayor.`,
        },
        {
          title: "Monto y Forma de Pago",
          body: `El monto total acordado es de RD$${ctx.totalAmount.toLocaleString()} (${formatMoneyInWords(ctx.totalAmount)}), pagaderos en tres tramos: 50% al firmar este contrato, 25% al completar la fase estructural, y 25% a la entrega final mediante Acta de Entrega firmada.`,
        },
        {
          title: "Obligaciones del Contratista",
          body: `Ejecutar los trabajos con calidad profesional, suministrar mano de obra calificada, supervisar la obra, cumplir el cronograma, mantener el área de trabajo segura y limpia, y entregar los trabajos terminados conforme al ${docNum("SOW", ctx.idx * 10 + 5, ctx.startDate)}.`,
        },
        {
          title: "Obligaciones del Contratante",
          body: `Realizar los pagos en las fechas acordadas, dar acceso al inmueble en horarios convenidos, despejar las áreas a intervenir antes del inicio, comunicar oportunamente cualquier observación o cambio, y firmar las actas de avance.`,
        },
        {
          title: "Modificaciones",
          body: `Cualquier modificación al alcance, plazo o precio se documentará mediante Orden de Cambio firmada por ambas partes antes de la ejecución del trabajo modificado. Sin firma previa, EL CONTRATISTA no está obligado a ejecutar trabajos adicionales.`,
        },
        {
          title: "Garantía",
          body: "EL CONTRATISTA garantiza los trabajos por 12 meses a partir de la firma del Acta de Entrega, contra defectos de instalación. La garantía no cubre desgaste por uso, daños causados por terceros, ni modificaciones realizadas sin autorización del CONTRATISTA.",
        },
        {
          title: "Fuerza Mayor",
          body: "Ninguna de las partes será responsable por retrasos o incumplimientos causados por eventos fuera de su control razonable, incluyendo pero no limitado a desastres naturales, pandemias, actos gubernamentales, o conflictos laborales. En caso de fuerza mayor, las partes acordarán un nuevo cronograma de ejecución.",
        },
        {
          title: "Resolución de Conflictos",
          body: "Las controversias se intentarán resolver de buena fe entre las partes. De persistir el desacuerdo, las partes se someten a los tribunales competentes del Distrito Nacional, República Dominicana, renunciando a cualquier otro fuero.",
        },
        {
          title: "Vigencia",
          body: "Este contrato entra en vigor el día de su firma y vence con la firma del Acta de Entrega, salvo en lo relativo a la garantía, que continuará vigente por los 12 meses pactados.",
        },
      ],
      closingText:
        "Hecho y firmado en dos (2) originales de igual tenor y validez, en Santo Domingo, República Dominicana, a los días del mes y año arriba indicados. Las partes declaran haber leído y comprendido cada cláusula.",
    },
  };
}

function buildSow(ctx: ProjectCtx) {
  const endDate = ctx.endDate || d(parseInt(ctx.startDate.slice(-2)) + 60);
  return {
    templateId: "sow",
    title: `Alcance de Trabajo – ${ctx.projectName}`,
    fields: {
      docNumber: docNum("SOW", ctx.idx * 10 + 5, ctx.startDate),
      date: fmt(ctx.startDate),
      clientName: ctx.clientName,
      clientCedula: ctx.clientCedula,
      clientPhone: ctx.clientPhone,
      projectName: ctx.projectName,
      address1: ctx.address1,
      address2: ctx.address2,
      cotRef: docNum("COT", ctx.idx * 10 + 2, d(-ctx.idx * 3 - 7)),
      startDate: fmt(ctx.startDate),
      endDate: fmt(endDate),
      scopeIncluded: [
        "Demolición y retiro de materiales existentes",
        "Nivelación y preparación de superficies",
        "Instalación de porcelanato en pisos y paredes",
        "Trabajos de pintura interior con 2 manos",
        "Instalación de cielo raso en PVC o tablayeso",
        "Renovación de instalaciones sanitarias y eléctricas en área de trabajo",
        "Limpieza general al finalizar",
      ],
      scopeExcluded: [
        "Mobiliario y decoración",
        "Equipos de cocina o baño",
        "Trabajos en áreas no especificadas",
        "Obras exteriores",
      ],
      tranches: [
        {
          label: "Inicio de obra",
          percentage: 50,
          amount: Math.round(ctx.totalAmount * 0.5),
        },
        {
          label: "Mitad de obra (semana 3)",
          percentage: 30,
          amount: Math.round(ctx.totalAmount * 0.3),
        },
        {
          label: "Entrega final",
          percentage: 20,
          amount: Math.round(ctx.totalAmount * 0.2),
        },
      ],
      warrantyText:
        "12 meses de garantía sobre mano de obra. Excluye daños por uso inadecuado, humedad externa o modificaciones realizadas por terceros.",
    },
  };
}

function buildOt(ctx: ProjectCtx) {
  const endDate = ctx.endDate || d(parseInt(ctx.startDate.slice(-2)) + 60);
  return {
    templateId: "ot",
    title: `Orden de Trabajo – ${ctx.projectName}`,
    fields: {
      docNumber: docNum("OT", ctx.idx * 10 + 6, ctx.startDate),
      date: fmt(ctx.startDate),
      clientName: ctx.clientName,
      clientCedula: ctx.clientCedula,
      projectName: ctx.projectName,
      address1: ctx.address1,
      address2: ctx.address2,
      technician: [
        "Carlos Polanco",
        "Rafael Mejía",
        "Miguel Ángel Santos",
        "Juan De Los Santos",
      ][ctx.idx % 4],
      supervisor: [
        "Ing. Ana Reyes",
        "Ing. Pedro Castillo",
        "Ing. Luis Fernández",
      ][ctx.idx % 3],
      startDate: fmt(ctx.startDate),
      estimatedDelivery: fmt(endDate),
      sowRef: docNum("SOW", ctx.idx * 10 + 5, ctx.startDate),
      status: "en-curso" as const,
      tasks: [
        {
          description: "Demolición de revestimientos existentes",
          responsible: "Equipo A",
          days: "3",
          status: "hecho" as const,
        },
        {
          description: "Nivelación de superficies y preparación",
          responsible: "Equipo A",
          days: "2",
          status: "hecho" as const,
        },
        {
          description: "Instalación de impermeabilizante",
          responsible: "Equipo B",
          days: "1",
          status: "en-curso" as const,
        },
        {
          description: "Colocación de porcelanato en piso",
          responsible: "Equipo B",
          days: "4",
          status: "pendiente" as const,
        },
        {
          description: "Revestimiento de paredes",
          responsible: "Equipo B",
          days: "3",
          status: "pendiente" as const,
        },
        {
          description: "Instalación eléctrica y sanitaria",
          responsible: "Equipo C",
          days: "2",
          status: "pendiente" as const,
        },
        {
          description: "Cielo raso y acabados",
          responsible: "Equipo A",
          days: "2",
          status: "pendiente" as const,
        },
        {
          description: "Pintura general (2 manos)",
          responsible: "Equipo D",
          days: "3",
          status: "pendiente" as const,
        },
        {
          description: "Limpieza final y entrega",
          responsible: "Todos",
          days: "1",
          status: "pendiente" as const,
        },
      ],
      materials:
        "Porcelanato 60×60 Gris Grigio, Pintura Lavable Titanlux Blanco Mate, Masilla Plus, Impermeabilizante Sika. Ver RM adjunto.",
      observations:
        "Acceso restringido después de las 5pm. Proteger área de comedor con plástico durante demolición.",
    },
  };
}

function buildGantt(ctx: ProjectCtx) {
  const endDate = ctx.endDate || d(parseInt(ctx.startDate.slice(-2)) + 60);
  return {
    templateId: "gantt",
    title: `Cronograma – ${ctx.projectName}`,
    fields: {
      docNumber: docNum("GANTT", ctx.idx * 10 + 7, ctx.startDate),
      date: fmt(ctx.startDate),
      period: `${fmt(ctx.startDate)} al ${fmt(endDate)}`,
      projectName: ctx.projectName,
      clientName: ctx.clientName,
      sowRef: docNum("SOW", ctx.idx * 10 + 5, ctx.startDate),
      phases: [
        {
          name: "Demolición y retiro",
          startWeek: 1,
          endWeek: 1,
          color: "#B95D34",
        },
        {
          name: "Preparación de superficies",
          startWeek: 2,
          endWeek: 2,
          color: "#B95D34",
        },
        {
          name: "Instalaciones sanitarias y eléctricas",
          startWeek: 2,
          endWeek: 3,
          color: "#6B7A3F",
        },
        {
          name: "Colocación de porcelanato",
          startWeek: 3,
          endWeek: 5,
          color: "#6B7A3F",
        },
        {
          name: "Cielo raso y carpintería",
          startWeek: 5,
          endWeek: 6,
          color: "#6B7A3F",
        },
        {
          name: "Pintura y acabados finos",
          startWeek: 6,
          endWeek: 7,
          color: "#1F1D1B",
        },
        {
          name: "Punch list y entrega",
          startWeek: 8,
          endWeek: 8,
          color: "#1F1D1B",
        },
      ],
    },
  };
}

function buildRd(ctx: ProjectCtx, dayOffset: number) {
  const date = d(dayOffset);
  return {
    templateId: "rd",
    title: `Reporte Diario ${fmt(date)} – ${ctx.projectName}`,
    fields: {
      docNumber: docNum("RD", ctx.idx * 100 + Math.abs(dayOffset), date),
      date: fmt(date),
      projectName: ctx.projectName,
      otRef: docNum("OT", ctx.idx * 10 + 6, ctx.startDate),
      dayOf: String(Math.abs(dayOffset) + 1),
      supervisor: [
        "Ing. Ana Reyes",
        "Ing. Pedro Castillo",
        "Ing. Luis Fernández",
      ][ctx.idx % 3],
      weather: ["Soleado", "Parcialmente nublado", "Nublado"][
        Math.abs(dayOffset) % 3
      ],
      personnel: [
        {
          name: "Carlos Polanco",
          role: "Técnico",
          entry: "08:00",
          exit: "17:00",
          hours: 9,
        },
        {
          name: "Rafael Mejía",
          role: "Ayudante",
          entry: "08:00",
          exit: "17:00",
          hours: 9,
        },
        {
          name: "José Matos",
          role: "Especialista",
          entry: "09:00",
          exit: "16:00",
          hours: 7,
        },
      ],
      worksDone: [
        "Continuación de colocación de porcelanato en área especificada",
        "Aplicación de primera mano de fragüe en sección completada",
        "Preparación de superficie para siguiente área",
      ],
      materialsReceived:
        dayOffset % 2 === 0
          ? ["2 cajas porcelanato 60×60", "1 saco fragüe gris"]
          : [],
      incidents: "Sin incidentes.",
      progressPercent: `${30 + Math.abs(dayOffset) * 5}%`,
      daysElapsed: String(Math.abs(dayOffset) + 1),
      scheduleStatus: "en-curso" as const,
      planTomorrow:
        "Continuar colocación de porcelanato y comenzar instalación de zócalo.",
    },
  };
}

function buildHt(ctx: ProjectCtx) {
  const weekStart = d(-ctx.idx * 7 - 14);
  const weekEnd = d(-ctx.idx * 7 - 8);
  const rows = [
    {
      name: "Carlos Polanco",
      role: "Técnico Principal",
      days: [1, 1, 1, 1, 1, 0, 0],
      totalDays: 5,
      dailyRate: 3500,
      total: 17500,
    },
    {
      name: "Rafael Mejía",
      role: "Técnico Auxiliar",
      days: [1, 1, 1, 1, 1, 0, 0],
      totalDays: 5,
      dailyRate: 2800,
      total: 14000,
    },
    {
      name: "José Matos",
      role: "Especialista Porcelanato",
      days: [1, 1, 1, 0, 1, 0, 0],
      totalDays: 4,
      dailyRate: 4200,
      total: 16800,
    },
    {
      name: "Miguel Ángel Santos",
      role: "Ayudante",
      days: [1, 1, 0, 1, 1, 0, 0],
      totalDays: 4,
      dailyRate: 2000,
      total: 8000,
    },
  ];
  const totalPayroll = rows.reduce((s, r) => s + r.total, 0);
  return {
    templateId: "ht",
    title: `Hoja de Tiempo – Semana ${ctx.idx + 1} – ${ctx.projectName}`,
    fields: {
      docNumber: docNum("HT", ctx.idx * 10 + 8, weekStart),
      weekRange: `${fmt(weekStart)} al ${fmt(weekEnd)}`,
      projectName: ctx.projectName,
      supervisor: [
        "Ing. Ana Reyes",
        "Ing. Pedro Castillo",
        "Ing. Luis Fernández",
      ][ctx.idx % 3],
      period: `Semana ${ctx.idx + 1}`,
      paymentStatus: "pagado",
      rows,
      totalDaysPerson: rows.reduce((s, r) => s + r.totalDays, 0),
      totalPayroll,
      observations:
        "Semana sin ausentismos. Se solicita bono de productividad por avance adelantado.",
      paymentMethod: "Transferencia bancaria",
      paymentDate: fmt(d(-ctx.idx * 7 - 7)),
      paymentTime: "10:00 AM",
    },
  };
}

function buildRm(ctx: ProjectCtx) {
  const date = d(-ctx.idx * 3 - 5);
  const items = [
    {
      number: 1,
      description: "Porcelanato 60×60 Gris Grigio",
      spec: "1ra calidad, rectificado",
      unit: "caja",
      qty: 25,
      refPrice: 2800,
      subtotal: 70000,
    },
    {
      number: 2,
      description: "Fragüe gris perla",
      spec: "Sika color plus",
      unit: "saco",
      qty: 8,
      refPrice: 650,
      subtotal: 5200,
    },
    {
      number: 3,
      description: "Adhesivo para cerámica",
      spec: "Porcelanite Plus",
      unit: "saco",
      qty: 12,
      refPrice: 580,
      subtotal: 6960,
    },
    {
      number: 4,
      description: "Impermeabilizante Sikalastic 400N",
      spec: "20 kg",
      unit: "cubeta",
      qty: 3,
      refPrice: 4500,
      subtotal: 13500,
    },
    {
      number: 5,
      description: "Pintura Lavable Blanco Mate",
      spec: "Titanlux 5 gl",
      unit: "cubo",
      qty: 6,
      refPrice: 3200,
      subtotal: 19200,
    },
  ];
  const subtotal = items.reduce((s, x) => s + x.subtotal, 0);
  const itbis = Math.round(subtotal * 0.18);
  return {
    templateId: "rm",
    title: `Requisición de Materiales – ${ctx.projectName}`,
    fields: {
      docNumber: docNum("RM", ctx.idx * 10 + 9, date),
      date: fmt(date),
      supplierName: [
        "Ferretería La Nacional",
        "Construrama DN",
        "Depósito ABC",
        "Ferretería Ochoa",
      ][ctx.idx % 4],
      supplierAddress: "Av. Duarte Km 3, Santo Domingo",
      supplierContact: "809-555-9999",
      requestedBy: [
        "Ing. Ana Reyes",
        "Ing. Pedro Castillo",
        "Ing. Luis Fernández",
      ][ctx.idx % 3],
      authorizedBy: "Ing. Gabriel Báez",
      otRef: docNum("OT", ctx.idx * 10 + 6, ctx.startDate),
      projectName: ctx.projectName,
      urgency: ["Normal", "Alta", "Normal"][ctx.idx % 3],
      deliveryMethod: "Entrega en obra",
      paymentTerms: ["Crédito 15 días", "Contado", "Crédito 30 días"][
        ctx.idx % 3
      ],
      items,
      subtotal,
      itbis,
      total: subtotal + itbis,
      dispatchInstructions: `Entregar en ${ctx.address1}. Contactar supervisor al llegar.`,
      authorizedBudget: Math.round(ctx.totalAmount * 0.3),
      thisRequisition: subtotal + itbis,
      remainingMargin: Math.round(ctx.totalAmount * 0.3) - (subtotal + itbis),
    },
  };
}

function buildAr(ctx: ProjectCtx) {
  const date = d(-ctx.idx * 5 - 10);
  return {
    templateId: "ar",
    title: `Acta de Reunión – ${ctx.projectName}`,
    fields: {
      docNumber: docNum("AR", ctx.idx * 10 + 10, date),
      dateTime: `${fmt(date)} · 10:00 AM`,
      projectName: ctx.projectName,
      clientName: ctx.clientName,
      location: ctx.address1,
      duration: "60 minutos",
      attendees: [
        { name: ctx.clientName, role: "Cliente", status: "Presente" as const },
        {
          name: "Ing. Gabriel Báez",
          role: "Director de Proyecto – Kanan",
          status: "Presente" as const,
        },
        {
          name: [
            "Ing. Ana Reyes",
            "Ing. Pedro Castillo",
            "Ing. Luis Fernández",
          ][ctx.idx % 3],
          role: "Supervisor de Obra",
          status: "Presente" as const,
        },
      ],
      agenda: [
        "Revisión de avance semanal",
        "Selección de materiales pendientes",
        "Ajustes al cronograma",
        "Próximos hitos y desembolsos",
      ],
      decisions: [
        {
          description: "Se aprueba cambio de porcelanato a modelo Grigio 60×60",
          justification: "Mejor relación calidad-precio",
        },
        {
          description: "Se ajusta fecha de entrega por retraso en materiales",
          justification: "Proveedor confirmó entrega en 5 días adicionales",
        },
      ],
      actionItems: [
        {
          task: "Confirmar pedido de porcelanato",
          responsible: "Ing. Báez",
          deadline: fmt(d(-ctx.idx * 5 - 7)),
          status: "hecho" as const,
        },
        {
          task: "Enviar estado de cuenta actualizado",
          responsible: "Administración Kanan",
          deadline: fmt(d(-ctx.idx * 5 - 5)),
          status: "hecho" as const,
        },
        {
          task: "Revisión de instalaciones eléctricas por inspector",
          responsible: ctx.clientName,
          deadline: fmt(d(-ctx.idx * 5)),
          status: "pendiente" as const,
        },
      ],
      nextMeeting: {
        date: fmt(d(-ctx.idx * 5 + 7)),
        modality: "Presencial en obra",
        topic: "Revisión de avance y aprobación de acabados finales",
      },
    },
  };
}

function buildFac(ctx: ProjectCtx, tranche: number, pending = false) {
  const date = d(-ctx.idx * 3 - 40 + tranche * 20);
  const amount =
    tranche === 1
      ? Math.round(ctx.totalAmount * 0.5)
      : tranche === 2
        ? Math.round(ctx.totalAmount * 0.3)
        : Math.round(ctx.totalAmount * 0.2);
  const subtotal = Math.round(amount / 1.18);
  const itbis = amount - subtotal;
  const items = [
    {
      description: `Tracto ${tranche} – ${ctx.projectName}`,
      unit: "gl",
      qty: 1,
      unitPrice: subtotal,
      total: subtotal,
    },
  ];
  return {
    templateId: "fac",
    title: `Factura Tracto ${tranche} – ${ctx.projectName}`,
    fields: {
      docNumber: docNum("FAC", ctx.idx * 30 + tranche, date),
      date: fmt(date),
      ncf: `B0${tranche}${String(ctx.idx).padStart(8, "0")}`,
      rnc: "131-00001-1",
      ncfType: "Crédito Fiscal",
      clientName: ctx.clientName,
      clientCedula: ctx.clientCedula,
      clientPhone: ctx.clientPhone,
      projectName: ctx.projectName,
      cotRef: docNum("COT", ctx.idx * 10 + 2, d(-ctx.idx * 3 - 7)),
      items,
      subtotal,
      itbis,
      total: amount,
      paymentMethod: "Transferencia bancaria",
      dueDate: fmt(d(-ctx.idx * 3 - 33 + tranche * 20)),
      bankName: "Banco Popular Dominicano",
      bankAccount: "816-123456-7",
      paymentStatus: pending || tranche === 3 ? "pendiente" : "hecho",
    },
  };
}

function buildRec(ctx: ProjectCtx, tranche: number) {
  const date = d(-ctx.idx * 3 - 38 + tranche * 20);
  const amount =
    tranche === 1
      ? Math.round(ctx.totalAmount * 0.5)
      : tranche === 2
        ? Math.round(ctx.totalAmount * 0.3)
        : Math.round(ctx.totalAmount * 0.2);
  const words = ["Quinientos", "Trescientos", "Doscientos"][tranche - 1];
  return {
    templateId: "rec",
    title: `Recibo de Pago Tracto ${tranche} – ${ctx.projectName}`,
    fields: {
      docNumber: docNum("REC", ctx.idx * 30 + tranche, date),
      date: fmt(date),
      clientName: ctx.clientName,
      projectName: ctx.projectName,
      amount,
      amountWords: `${words} mil pesos dominicanos con 00/100`,
      concept: `Pago Tracto ${tranche} – ${ctx.projectName}`,
      facRef: docNum(
        "FAC",
        ctx.idx * 30 + tranche,
        d(-ctx.idx * 3 - 40 + tranche * 20),
      ),
      reference: `TRF-${ctx.idx * 100 + tranche}`,
      paymentMethod: "Transferencia bancaria",
      bankConfirmation: `CONF-BPD-${Date.now().toString().slice(-8)}`,
      balanceNote:
        tranche === 3
          ? "Saldo saldado en su totalidad."
          : `Saldo pendiente: RD$${Math.round(ctx.totalAmount * (tranche === 1 ? 0.5 : 0.2)).toLocaleString()} (${formatMoneyInWords(Math.round(ctx.totalAmount * (tranche === 1 ? 0.5 : 0.2)))})`,
      balanceNoteInWords:
        tranche === 3
          ? ""
          : formatMoneyInWords(
              Math.round(ctx.totalAmount * (tranche === 1 ? 0.5 : 0.2)),
            ),
    },
  };
}

function buildEc(ctx: ProjectCtx) {
  const cutDate = d(-ctx.idx * 3 - 5);
  const t1 = Math.round(ctx.totalAmount * 0.5);
  const t2 = Math.round(ctx.totalAmount * 0.3);
  const t3 = Math.round(ctx.totalAmount * 0.2);
  return {
    templateId: "ec",
    title: `Estado de Cuenta – ${ctx.projectName}`,
    fields: {
      docNumber: docNum("EC", ctx.idx * 10 + 11, cutDate),
      cutDate: fmt(cutDate),
      clientName: ctx.clientName,
      clientCedula: ctx.clientCedula,
      projectName: ctx.projectName,
      sowRef: docNum("SOW", ctx.idx * 10 + 5, ctx.startDate),
      totalContracted: ctx.totalAmount,
      totalPaid: t1 + t2,
      balance: t3,
      nextDueDate: fmt(d(-ctx.idx * 3 + 15)),
      movements: [
        {
          date: fmt(d(-ctx.idx * 3 - 40)),
          concept: "Factura Tracto 1",
          document: docNum("FAC", ctx.idx * 30 + 1, d(-ctx.idx * 3 - 40)),
          charge: t1,
          credit: null,
          balance: t1,
        },
        {
          date: fmt(d(-ctx.idx * 3 - 38)),
          concept: "Pago Tracto 1",
          document: docNum("REC", ctx.idx * 30 + 1, d(-ctx.idx * 3 - 38)),
          charge: null,
          credit: t1,
          balance: 0,
        },
        {
          date: fmt(d(-ctx.idx * 3 - 20)),
          concept: "Factura Tracto 2",
          document: docNum("FAC", ctx.idx * 30 + 2, d(-ctx.idx * 3 - 20)),
          charge: t2,
          credit: null,
          balance: t2,
        },
        {
          date: fmt(d(-ctx.idx * 3 - 18)),
          concept: "Pago Tracto 2",
          document: docNum("REC", ctx.idx * 30 + 2, d(-ctx.idx * 3 - 18)),
          charge: null,
          credit: t2,
          balance: 0,
        },
        {
          date: fmt(d(-ctx.idx * 3 - 5)),
          concept: "Factura Tracto 3",
          document: docNum("FAC", ctx.idx * 30 + 3, d(-ctx.idx * 3 - 5)),
          charge: t3,
          credit: null,
          balance: t3,
        },
      ],
      nextCharge: {
        concept: "Pago Tracto 3 – Entrega Final",
        amount: t3,
        dueDate: fmt(d(-ctx.idx * 3 + 15)),
      },
      paymentNote:
        "Por favor realizar transferencia a Banco Popular Dominicano Cta. 816-123456-7 indicando número de factura.",
    },
  };
}

function buildPl(ctx: ProjectCtx) {
  const walkthroughDate = d(-ctx.idx * 3 - 15);
  return {
    templateId: "pl",
    title: `Punch List – ${ctx.projectName}`,
    fields: {
      docNumber: docNum("PL", ctx.idx * 10 + 12, walkthroughDate),
      walkthroughDate: fmt(walkthroughDate),
      clientName: ctx.clientName,
      projectName: ctx.projectName,
      sowRef: docNum("SOW", ctx.idx * 10 + 5, ctx.startDate),
      walkthroughBy: "Ing. Gabriel Báez",
      targetCloseDate: fmt(d(-ctx.idx * 3 - 5)),
      items: [
        {
          number: 1,
          location: "Sala",
          description: "Retoque pintura en esquina NE",
          responsible: "Equipo Pintura",
          date: fmt(d(-ctx.idx * 3 - 10)),
          status: "hecho" as const,
        },
        {
          number: 2,
          location: "Baño principal",
          description: "Fragüe incompleto en esquina ducha",
          responsible: "Equipo Porcelanato",
          date: fmt(d(-ctx.idx * 3 - 10)),
          status: "hecho" as const,
        },
        {
          number: 3,
          location: "Cocina",
          description: "Ajuste de puerta de gabinete",
          responsible: "Carpintero",
          date: fmt(d(-ctx.idx * 3 - 8)),
          status: "hecho" as const,
        },
        {
          number: 4,
          location: "Comedor",
          description: "Limpieza de residuos de adhesivo en piso",
          responsible: "Equipo Limpieza",
          date: fmt(d(-ctx.idx * 3 - 7)),
          status: "hecho" as const,
        },
        {
          number: 5,
          location: "General",
          description: "Retiro de materiales sobrantes y escombros",
          responsible: "Equipo General",
          date: fmt(d(-ctx.idx * 3 - 6)),
          status: "hecho" as const,
        },
      ],
      observations:
        "Todos los puntos resueltos satisfactoriamente. Cliente aprueba para entrega final.",
    },
  };
}

function buildAe(ctx: ProjectCtx) {
  const aeDate = ctx.endDate || d(-ctx.idx * 3 - 5);
  return {
    templateId: "ae",
    title: `Acta de Entrega – ${ctx.projectName}`,
    fields: {
      docNumber: docNum("AE", ctx.idx * 10 + 13, aeDate),
      date: fmt(aeDate),
      clientName: ctx.clientName,
      clientCedula: ctx.clientCedula,
      projectName: ctx.projectName,
      address1: ctx.address1,
      address2: ctx.address2,
      sowRef: docNum("SOW", ctx.idx * 10 + 5, ctx.startDate),
      startDate: fmt(ctx.startDate),
      deliveryDate: fmt(aeDate),
      executedWorks: [
        "Demolición y retiro de revestimientos existentes",
        "Instalación de porcelanato en pisos y paredes",
        "Renovación de instalaciones sanitarias y eléctricas",
        "Instalación de cielo raso en tablayeso",
        "Pintura general interior (2 manos)",
        "Limpieza general y retiro de escombros",
      ],
      deliverables: [
        "Espacios remodelados según planos acordados",
        "Manual de mantenimiento de materiales instalados",
        "Garantía escrita 12 meses mano de obra",
        "Factura y recibos de pago",
      ],
      totalContract: ctx.totalAmount,
      paid: ctx.totalAmount,
      balance: 0,
      warrantyText:
        "12 meses de garantía en mano de obra a partir de esta fecha. Para hacer válida la garantía comunicarse al 809-555-0001.",
      clientObservations:
        "Cliente satisfecho con los trabajos ejecutados. Aprueba entrega sin observaciones pendientes.",
    },
  };
}

function buildEs(ctx: ProjectCtx) {
  const esDate = ctx.endDate || d(-ctx.idx * 3 - 3);
  return {
    templateId: "es",
    title: `Encuesta de Satisfacción – ${ctx.projectName}`,
    fields: {
      docNumber: docNum("ES", ctx.idx * 10 + 14, esDate),
      date: fmt(esDate),
      clientName: ctx.clientName,
      projectAndDate: `${ctx.projectName} | ${fmt(esDate)}`,
      ratings: [
        {
          aspect: "Calidad de los acabados",
          score: [5, 4, 5, 4, 5][ctx.idx % 5] as 5 | 4 | 3 | 2 | 1,
        },
        {
          aspect: "Cumplimiento del cronograma",
          score: [4, 5, 4, 5, 4][ctx.idx % 5] as 5 | 4 | 3 | 2 | 1,
        },
        {
          aspect: "Comunicación y seguimiento",
          score: [5, 5, 4, 4, 5][ctx.idx % 5] as 5 | 4 | 3 | 2 | 1,
        },
        {
          aspect: "Limpieza y orden en obra",
          score: [4, 4, 5, 5, 4][ctx.idx % 5] as 5 | 4 | 3 | 2 | 1,
        },
        {
          aspect: "Relación calidad-precio",
          score: [5, 4, 5, 4, 5][ctx.idx % 5] as 5 | 4 | 3 | 2 | 1,
        },
      ],
      bestThings:
        "El equipo fue muy profesional y mantuvo el área limpia en todo momento. La calidad de los materiales superó mis expectativas.",
      improvements:
        "Mejorar la comunicación sobre cambios de última hora en el cronograma.",
      wouldRecommend: "yes" as const,
      testimonialConsent: "named" as const,
      testimonial: `Kanan transformó completamente el espacio. El resultado final superó lo que imaginábamos. Definitivamente los recomendamos.`,
    },
  };
}

function buildGr(ctx: ProjectCtx) {
  const grDate = ctx.endDate || d(-ctx.idx * 3 - 5);
  const warrantyEndDate = d((ctx.endDate ? 0 : -ctx.idx * 3 - 5) + 365);
  return {
    templateId: "gr",
    title: `Carta de Garantía – ${ctx.projectName}`,
    fields: {
      docNumber: docNum("GR", ctx.idx * 10 + 15, grDate),
      date: fmt(grDate),
      clientName: ctx.clientName,
      clientCedula: ctx.clientCedula,
      projectName: ctx.projectName,
      address1: ctx.address1,
      address2: ctx.address2,
      sowRef: docNum("SOW", ctx.idx * 10 + 5, ctx.startDate),
      aeRef: docNum("AE", ctx.idx * 10 + 13, grDate),
      warrantyStart: fmt(grDate),
      warrantyEnd: fmt(warrantyEndDate),
      coveragePeriodText: "12 meses a partir de la fecha de entrega",
      worksCovered: [
        "Revestimientos de pisos y paredes (porcelanato, cerámica)",
        "Trabajos de pintura interior",
        "Cielo raso instalado",
        "Instalaciones sanitarias renovadas",
        "Instalaciones eléctricas en áreas intervenidas",
      ],
      exclusions: [
        "Daños causados por uso inadecuado o negligencia del cliente",
        "Daños por humedad proveniente de fuentes externas",
        "Modificaciones realizadas por terceros no autorizados por Kanan",
        "Desgaste normal por uso cotidiano",
        "Daños causados por fenómenos naturales",
      ],
      claimProcess:
        "Para activar la garantía, comunicarse al 809-555-0001 o warranty@kananconstrucciones.do dentro de las primeras 24 horas de detectar el problema. Se asignará un técnico en 48 horas hábiles.",
      signatoryName: "Ing. Gabriel Báez",
      rnc: "131-00001-1",
    },
  };
}

// ─── Master document builder per status ──────────────────────────────────────

function buildDocs(ctx: ProjectCtx, status: string) {
  const vt = buildVt(ctx);
  const cot = buildCot(ctx);
  const pv = buildPv(ctx);

  if (status === "cotizando") return [vt, cot, pv];

  const cs = buildCs(ctx);
  const sow = buildSow(ctx);
  const ot = buildOt(ctx);
  const gantt = buildGantt(ctx);
  const rd = buildRd(ctx, -ctx.idx * 3 - 20);
  const ht = buildHt(ctx);
  const rm = buildRm(ctx);
  const ar = buildAr(ctx);
  const fac1 = buildFac(ctx, 1);
  const fac2 = buildFac(ctx, 2, status === "activo"); // pending for active projects
  const rec1 = buildRec(ctx, 1);
  const ec = buildEc(ctx);

  if (status === "activo") {
    // fac1 cobrada (hecho) + rec1; fac2 pendiente (sin recibo aún)
    return [vt, cot, cs, sow, ot, gantt, rd, ht, rm, ar, fac1, fac2, rec1, ec];
  }

  const rec2 = buildRec(ctx, 2);

  const pl = buildPl(ctx);
  const fac3 = buildFac(ctx, 3);
  const rec3 = buildRec(ctx, 3);
  const ae = buildAe(ctx);
  const es = buildEs(ctx);

  if (status === "completado") {
    return [
      vt,
      cot,
      cs,
      sow,
      ot,
      gantt,
      rd,
      ht,
      rm,
      ar,
      fac1,
      fac2,
      fac3,
      rec1,
      rec2,
      rec3,
      pl,
      ae,
      ec,
      es,
    ];
  }

  // garantia
  const gr = buildGr(ctx);
  return [
    vt,
    cot,
    cs,
    sow,
    ot,
    gantt,
    rd,
    ht,
    rm,
    ar,
    fac1,
    fac2,
    fac3,
    rec1,
    rec2,
    rec3,
    pl,
    ae,
    ec,
    es,
    gr,
  ];
}

// ─── Main seed ────────────────────────────────────────────────────────────────

async function seed() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("MONGODB_URI no definida en .env");
    process.exit(1);
  }

  console.log("Conectando a MongoDB...");
  await mongoose.connect(uri);
  console.log("Conectado.");

  // Limpiar colecciones
  console.log("Limpiando colecciones existentes...");
  await Document.deleteMany({});
  await Project.deleteMany({});
  await Client.deleteMany({});
  console.log("Colecciones limpias.");

  // Insertar clientes
  console.log("Insertando 13 clientes...");
  const insertedClients = await Client.insertMany(clientsData);
  console.log(`✓ ${insertedClients.length} clientes creados.`);

  // Construir e insertar proyectos
  console.log("Insertando 20 proyectos...");
  const projectDocs = projectsData.map((p) => ({
    name: p.name,
    address1: p.address1,
    address2: p.address2,
    clientId: insertedClients[p.clientIndex]!._id,
    status: p.status,
    startDate: p.startDate ? new Date(p.startDate) : undefined,
    endDate: p.endDate ? new Date(p.endDate) : undefined,
    totalAmount: p.totalAmount,
    preferredTheme: p.preferredTheme,
    historial: [],
  }));
  const insertedProjects = await Project.insertMany(projectDocs);
  console.log(`✓ ${insertedProjects.length} proyectos creados.`);

  // Construir e insertar documentos
  console.log("Generando documentos por proyecto...");
  const allDocuments: object[] = [];

  projectsData.forEach((pDef, idx) => {
    const proj = insertedProjects[idx];
    const client = insertedClients[pDef.clientIndex];
    const ctx: ProjectCtx = {
      projectName: pDef.name,
      clientName: client!.name,
      clientCedula: client!.cedula || "001-0000000-0",
      clientPhone: client!.phone || "809-555-0000",
      clientEmail: client!.email || "cliente@email.com",
      address1: pDef.address1,
      address2: pDef.address2,
      totalAmount: pDef.totalAmount,
      startDate: pDef.startDate || d(0),
      endDate: pDef.endDate || "",
      idx,
    };

    const docs = buildDocs(ctx, pDef.status);
    docs.forEach((doc) => {
      allDocuments.push({
        templateId: doc.templateId,
        title: doc.title,
        projectId: proj!._id,
        theme: pDef.preferredTheme,
        fields: doc.fields,
      });
    });
  });

  console.log(`Insertando ${allDocuments.length} documentos...`);
  await Document.insertMany(allDocuments);
  console.log(`✓ ${allDocuments.length} documentos creados.`);

  // Resumen
  const docsByStatus = projectsData.reduce<Record<string, number>>(
    (acc, p, i) => {
      const docsForThisProject = buildDocs(
        {
          projectName: p.name,
          clientName: "",
          clientCedula: "",
          clientPhone: "",
          clientEmail: "",
          address1: p.address1,
          address2: p.address2,
          totalAmount: p.totalAmount,
          startDate: p.startDate || "",
          endDate: p.endDate || "",
          idx: i,
        },
        p.status,
      ).length;
      acc[p.status] = (acc[p.status] || 0) + docsForThisProject;
      return acc;
    },
    {},
  );

  console.log("\n═══════════════════════════════════════════════════");
  console.log("  SEED COMPLETADO");
  console.log("═══════════════════════════════════════════════════");
  console.log(`  Clientes  : ${insertedClients.length}`);
  console.log(`  Proyectos : ${insertedProjects.length}`);
  console.log(`  Documentos: ${allDocuments.length}`);
  console.log("  ─────────────────────────────────────────────────");
  Object.entries(docsByStatus).forEach(([status, count]) => {
    const projCount = projectsData.filter((p) => p.status === status).length;
    console.log(
      `  ${status.padEnd(12)}: ${projCount} proyectos → ${count} documentos`,
    );
  });
  console.log("═══════════════════════════════════════════════════\n");

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error("Error en seed:", err);
  process.exit(1);
});
