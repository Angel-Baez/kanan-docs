import type { RequestHandler } from 'express';
import type { UserRole } from '../models/User.js';

export function authorize(...roles: UserRole[]): RequestHandler {
  return (req, res, next) => {
    if (!req.auth) {
      res.status(401).json({ error: 'No autenticado' });
      return;
    }
    if (!roles.includes(req.auth.role)) {
      res.status(403).json({ error: 'Sin permisos para esta acción' });
      return;
    }
    next();
  };
}
