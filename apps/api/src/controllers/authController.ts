import type { RequestHandler, CookieOptions } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import UserModel from '../models/User.js';
import RefreshTokenModel from '../models/RefreshToken.js';
import { env } from '../config/env.js';
import type { AuthPayload } from '../middleware/authenticate.js';

const ACCESS_TTL  = 15 * 60;          // 15 min (seconds)
const REFRESH_TTL = 7 * 24 * 60 * 60; // 7 days (seconds)

const cookieBase: CookieOptions = {
  httpOnly: true,
  sameSite: 'lax',
  secure: env.NODE_ENV === 'production',
  path: '/',
};

function issueAccess(payload: AuthPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: ACCESS_TTL });
}

function setAuthCookies(res: Parameters<RequestHandler>[1], access: string, refresh: string) {
  res.cookie('access',  access,  { ...cookieBase, maxAge: ACCESS_TTL  * 1000 });
  res.cookie('refresh', refresh, { ...cookieBase, maxAge: REFRESH_TTL * 1000 });
}

function clearAuthCookies(res: Parameters<RequestHandler>[1]) {
  res.clearCookie('access',  cookieBase);
  res.clearCookie('refresh', cookieBase);
}

// POST /api/v1/auth/login
export const login: RequestHandler = async (req, res, next) => {
  try {
    const { email, password } = req.body as { email?: string; password?: string };
    if (!email || !password) {
      res.status(400).json({ error: 'Email y contraseña requeridos' });
      return;
    }

    const user = await UserModel.findOne({ email: email.toLowerCase().trim() });
    if (!user || !user.isActive) {
      res.status(401).json({ error: 'Credenciales inválidas' });
      return;
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      res.status(401).json({ error: 'Credenciales inválidas' });
      return;
    }

    const payload: AuthPayload = {
      userId: String(user._id),
      role: user.role,
      name: user.name,
    };

    const access  = issueAccess(payload);
    const rawRefresh = crypto.randomBytes(64).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawRefresh).digest('hex');

    await RefreshTokenModel.create({
      userId: user._id,
      tokenHash,
      expiresAt: new Date(Date.now() + REFRESH_TTL * 1000),
    });

    setAuthCookies(res, access, rawRefresh);
    res.json({ user: { id: payload.userId, name: user.name, role: user.role, email: user.email } });
  } catch (e) {
    next(e);
  }
};

// POST /api/v1/auth/refresh
export const refresh: RequestHandler = async (req, res, next) => {
  try {
    const rawRefresh = req.cookies?.['refresh'] as string | undefined;
    if (!rawRefresh) {
      res.status(401).json({ error: 'Sin refresh token' });
      return;
    }

    const tokenHash = crypto.createHash('sha256').update(rawRefresh).digest('hex');
    const stored = await RefreshTokenModel.findOne({ tokenHash });

    if (!stored || stored.expiresAt < new Date()) {
      clearAuthCookies(res);
      res.status(401).json({ error: 'Sesión expirada' });
      return;
    }

    const user = await UserModel.findById(stored.userId);
    if (!user || !user.isActive) {
      clearAuthCookies(res);
      res.status(401).json({ error: 'Usuario inactivo' });
      return;
    }

    // Rotate: delete old refresh token, issue new pair
    await stored.deleteOne();

    const payload: AuthPayload = { userId: String(user._id), role: user.role, name: user.name };
    const access = issueAccess(payload);
    const newRaw = crypto.randomBytes(64).toString('hex');
    const newHash = crypto.createHash('sha256').update(newRaw).digest('hex');

    await RefreshTokenModel.create({
      userId: user._id,
      tokenHash: newHash,
      expiresAt: new Date(Date.now() + REFRESH_TTL * 1000),
    });

    setAuthCookies(res, access, newRaw);
    res.json({ user: { id: payload.userId, name: user.name, role: user.role, email: user.email } });
  } catch (e) {
    next(e);
  }
};

// POST /api/v1/auth/logout
export const logout: RequestHandler = async (req, res, next) => {
  try {
    const rawRefresh = req.cookies?.['refresh'] as string | undefined;
    if (rawRefresh) {
      const tokenHash = crypto.createHash('sha256').update(rawRefresh).digest('hex');
      await RefreshTokenModel.deleteOne({ tokenHash });
    }
    clearAuthCookies(res);
    res.status(204).send();
  } catch (e) {
    next(e);
  }
};

// GET /api/v1/auth/me
export const me: RequestHandler = async (req, res, next) => {
  try {
    const user = await UserModel.findById(req.auth!.userId).select('-passwordHash').lean();
    if (!user) {
      res.status(404).json({ error: 'Usuario no encontrado' });
      return;
    }
    res.json({ id: String(user._id), name: user.name, role: user.role, email: user.email });
  } catch (e) {
    next(e);
  }
};
