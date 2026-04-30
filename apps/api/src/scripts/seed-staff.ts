/**
 * Seeds the staff roster from known HT document workers.
 * Run once: npx tsx apps/api/src/scripts/seed-staff.ts
 */
import 'dotenv/config';
import mongoose from 'mongoose';
import StaffModel from '../models/Staff.js';
import { env } from '../config/env.js';

const STAFF = [
  { name: 'Carlos Polanco',      role: 'Técnico Principal',             dailyRate: 3500 },
  { name: 'Rafael Mejía',        role: 'Técnico Auxiliar',              dailyRate: 2800 },
  { name: 'Ing. Laura Sánchez',  role: 'Jefa de Obra',                  dailyRate: 5000 },
  { name: 'José Matos',          role: 'Especialista Porcelanato',      dailyRate: 4200 },
  { name: 'Miguel Ángel Santos', role: 'Ayudante General',              dailyRate: 2000 },
  { name: 'Ing. Ana Reyes',      role: 'Supervisora de Obra',           dailyRate: 6000 },
  { name: 'Ing. Pedro Castillo', role: 'Director de Proyectos',         dailyRate: 7500 },
  { name: 'Ing. Luis Fernández', role: 'Supervisor de Obra',            dailyRate: 5500 },
  { name: 'Ing. María Gómez',    role: 'Coordinadora de Proyectos',     dailyRate: 6500 },
  { name: 'Ing. Juan Pérez',     role: 'Gerente de Proyectos',          dailyRate: 8000 },
  { name: 'Jorge Rodríguez',     role: 'Técnico de Acabados',           dailyRate: 3000 },
  { name: 'Juana Martínez',      role: 'Diseñadora de Interiores',      dailyRate: 4500 },
  { name: 'Ing. Carlos López',   role: 'Supervisor de Seguridad',       dailyRate: 4000 },
  { }
];

async function run() {
  await mongoose.connect(env.MONGODB_URI);
  let created = 0;
  let skipped = 0;

  for (const s of STAFF) {
    const exists = await StaffModel.findOne({ name: s.name });
    if (exists) { skipped++; continue; }
    await StaffModel.create({ ...s, isActive: true });
    created++;
    console.log(`  ✓ ${s.name} (${s.role})`);
  }

  console.log(`\nCreados: ${created}  Omitidos: ${skipped}`);
  await mongoose.disconnect();
}

run().catch(err => { console.error(err); process.exit(1); });
