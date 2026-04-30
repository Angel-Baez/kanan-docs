import type { RequestHandler } from 'express';
import bcrypt from 'bcryptjs';
import UserModel from '../models/User.js';
import CompanySettings from '../models/CompanySettings.js';

// ── Company ──────────────────────────────────────────────────────────────────

// GET /api/v1/settings/company
export const getCompany: RequestHandler = async (_req, res, next) => {
  try {
    let doc = await CompanySettings.findOne().lean();
    if (!doc) doc = await CompanySettings.create({});
    res.json(doc);
  } catch (e) { next(e); }
};

// PUT /api/v1/settings/company  (admin only)
export const updateCompany: RequestHandler = async (req, res, next) => {
  try {
    const allowed = ['name', 'tagline', 'rnc', 'phone', 'email', 'address', 'website'];
    const update: Record<string, unknown> = {};
    for (const k of allowed) { if (k in req.body) update[k] = req.body[k]; }

    let doc = await CompanySettings.findOne();
    if (!doc) doc = new CompanySettings({});
    Object.assign(doc, update);
    await doc.save();
    res.json(doc.toObject());
  } catch (e) { next(e); }
};

// ── Users (admin) ─────────────────────────────────────────────────────────────

// GET /api/v1/settings/users
export const listUsers: RequestHandler = async (_req, res, next) => {
  try {
    const users = await UserModel.find().select('-passwordHash').sort({ createdAt: 1 }).lean();
    res.json(users);
  } catch (e) { next(e); }
};

// POST /api/v1/settings/users
export const createUser: RequestHandler = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body as Record<string, string>;
    if (!name || !email || !password) {
      res.status(400).json({ error: 'Nombre, email y contraseña requeridos' }); return;
    }
    if (password.length < 8) {
      res.status(400).json({ error: 'La contraseña debe tener al menos 8 caracteres' }); return;
    }
    const exists = await UserModel.findOne({ email: email.toLowerCase() });
    if (exists) { res.status(409).json({ error: 'Email ya registrado' }); return; }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await UserModel.create({ name, email, passwordHash, role: role ?? 'vendedor' });
    res.status(201).json({ _id: user._id, name: user.name, email: user.email, role: user.role, isActive: user.isActive });
  } catch (e) { next(e); }
};

// PATCH /api/v1/settings/users/:id
export const patchUser: RequestHandler = async (req, res, next) => {
  try {
    const allowed = ['name', 'role', 'isActive'];
    const update: Record<string, unknown> = {};
    for (const k of allowed) { if (k in req.body) update[k] = req.body[k]; }

    const user = await UserModel.findByIdAndUpdate(req.params['id'], update, { new: true })
      .select('-passwordHash').lean();
    if (!user) { res.status(404).json({ error: 'Usuario no encontrado' }); return; }
    res.json(user);
  } catch (e) { next(e); }
};

// ── Account (self) ────────────────────────────────────────────────────────────

// PATCH /api/v1/settings/me  — update own name
export const updateMe: RequestHandler = async (req, res, next) => {
  try {
    const { name } = req.body as { name?: string };
    if (!name?.trim()) { res.status(400).json({ error: 'Nombre requerido' }); return; }

    const user = await UserModel.findByIdAndUpdate(
      req.auth!.userId,
      { name: name.trim() },
      { new: true }
    ).select('-passwordHash').lean();
    res.json(user);
  } catch (e) { next(e); }
};

// POST /api/v1/settings/me/password  — change own password
export const changePassword: RequestHandler = async (req, res, next) => {
  try {
    const { current, next: newPass } = req.body as { current?: string; next?: string };
    if (!current || !newPass) {
      res.status(400).json({ error: 'Contraseña actual y nueva requeridas' }); return;
    }
    if (newPass.length < 8) {
      res.status(400).json({ error: 'La nueva contraseña debe tener al menos 8 caracteres' }); return;
    }

    const user = await UserModel.findById(req.auth!.userId);
    if (!user) { res.status(404).json({ error: 'Usuario no encontrado' }); return; }

    const ok = await bcrypt.compare(current, user.passwordHash);
    if (!ok) { res.status(401).json({ error: 'Contraseña actual incorrecta' }); return; }

    user.passwordHash = await bcrypt.hash(newPass, 12);
    await user.save();
    res.json({ ok: true });
  } catch (e) { next(e); }
};

// POST /api/v1/settings/users/:id/password  — admin resets any user's password
export const resetUserPassword: RequestHandler = async (req, res, next) => {
  try {
    const { password } = req.body as { password?: string };
    if (!password || password.length < 8) {
      res.status(400).json({ error: 'Contraseña mínima de 8 caracteres' }); return;
    }
    const hash = await bcrypt.hash(password, 12);
    const user = await UserModel.findByIdAndUpdate(req.params['id'], { passwordHash: hash }).lean();
    if (!user) { res.status(404).json({ error: 'Usuario no encontrado' }); return; }
    res.json({ ok: true });
  } catch (e) { next(e); }
};
