import type { RequestHandler } from 'express';
import { z } from 'zod';
import ClientModel from '../models/Client.js';
import ProjectModel from '../models/Project.js';

const schema = z.object({
  name: z.string().min(1),
  cedula: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  address1: z.string().optional(),
  address2: z.string().optional(),
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
    const current = await ClientModel.findById(req.params['id']).lean();
    if (!current) { res.status(404).json({ error: 'Cliente no encontrado' }); return; }

    const historialEntries: { campo: string; valorAnterior: string; valorNuevo: string; fecha: Date }[] = [];

    if (body.name && current.name !== body.name) {
      historialEntries.push({
        campo: 'name',
        valorAnterior: current.name,
        valorNuevo: body.name,
        fecha: new Date(),
      });
    }
    if (body.type && current.type !== body.type) {
      historialEntries.push({
        campo: 'type',
        valorAnterior: current.type,
        valorNuevo: body.type,
        fecha: new Date(),
      });
    }

    const update = historialEntries.length
      ? { ...body, $push: { historial: { $each: historialEntries } } }
      : body;

    const client = await ClientModel.findByIdAndUpdate(
      req.params['id'],
      update,
      { new: true, runValidators: true }
    ).lean();
    res.json(client);
  } catch (e) {
    next(e);
  }
};

export const getClientProjects: RequestHandler = async (req, res, next) => {
  try {
    const projects = await ProjectModel.find({ clientId: req.params['id'] })
      .sort({ createdAt: -1 })
      .lean();
    res.json(projects);
  } catch (e) {
    next(e);
  }
};
