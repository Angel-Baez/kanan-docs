import type { RequestHandler } from 'express';
import { z } from 'zod';
import ClientModel from '../models/Client.js';

const schema = z.object({
  name: z.string().min(1),
  cedula: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  address: z.string().optional(),
  type: z.enum(['residencial', 'comercial', 'institucional']).default('residencial'),
});

export const listClients: RequestHandler = async (_req, res, next) => {
  try {
    const clients = await ClientModel.find().sort({ name: 1 }).lean();
    res.json(clients);
  } catch (e) {
    next(e);
  }
};

export const createClient: RequestHandler = async (req, res, next) => {
  try {
    const body = schema.parse(req.body);
    const client = await ClientModel.create(body);
    res.status(201).json(client);
  } catch (e) {
    next(e);
  }
};

export const getClient: RequestHandler = async (req, res, next) => {
  try {
    const client = await ClientModel.findById(req.params['id']).lean();
    if (!client) { res.status(404).json({ error: 'Cliente no encontrado' }); return; }
    res.json(client);
  } catch (e) {
    next(e);
  }
};

export const updateClient: RequestHandler = async (req, res, next) => {
  try {
    const body = schema.partial().parse(req.body);
    const client = await ClientModel.findByIdAndUpdate(
      req.params['id'],
      body,
      { new: true, runValidators: true }
    ).lean();
    if (!client) { res.status(404).json({ error: 'Cliente no encontrado' }); return; }
    res.json(client);
  } catch (e) {
    next(e);
  }
};
