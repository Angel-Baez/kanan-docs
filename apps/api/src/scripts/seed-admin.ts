/**
 * Creates the first admin user.
 * Run once: npx tsx apps/api/src/scripts/seed-admin.ts
 *
 * Reads credentials from env (or uses safe defaults for local dev):
 *   ADMIN_EMAIL    (default: admin@kanan.do)
 *   ADMIN_PASSWORD (default: kanan2026!)
 *   ADMIN_NAME     (default: Administrador)
 */

import 'dotenv/config';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import UserModel from '../models/User.js';
import { env } from '../config/env.js';

async function run() {
  await mongoose.connect(env.MONGODB_URI);

  const email    = (process.env['ADMIN_EMAIL']    ?? 'admin@kanan.do').toLowerCase();
  const password =  process.env['ADMIN_PASSWORD'] ?? 'kanan2026!';
  const name     =  process.env['ADMIN_NAME']     ?? 'Administrador';

  const existing = await UserModel.findOne({ email });
  if (existing) {
    console.log(`⚠  Ya existe un usuario con ese email: ${email}`);
    await mongoose.disconnect();
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await UserModel.create({ name, email, passwordHash, role: 'admin', isActive: true });

  console.log('✓ Admin creado:');
  console.log(`  Email:    ${email}`);
  console.log(`  Password: ${password}`);
  console.log(`  Role:     admin`);

  await mongoose.disconnect();
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
