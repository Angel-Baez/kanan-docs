import type { RequestHandler } from 'express';
import { z } from 'zod';
import ProjectModel from '../models/Project.js';
import DocumentModel from '../models/Document.js';

const schema = z.object({
  name: z.string().min(1),
  address1: z.string().optional(),
  address2: z.string().optional(),
  clientId: z.string().min(1),
  status: z.enum(['cotizando', 'activo', 'completado', 'garantia']).default('cotizando'),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  totalAmount: z.number().optional(),
  preferredTheme: z.enum(['base', 't', 'o', 'plena']).default('o'),
});

export const listProjects: RequestHandler = async (req, res, next) => {
  try {
    const filter = req.query['clientId'] ? { clientId: req.query['clientId'] } : {};
    const projects = await ProjectModel.find(filter).sort({ createdAt: -1 }).lean();
    res.json(projects);
  } catch (e) {
    next(e);
  }
};

export const createProject: RequestHandler = async (req, res, next) => {
  try {
    const body = schema.parse(req.body);
    console.log(body)
    const project = await ProjectModel.create(body);
    res.status(201).json(project);
  } catch (e) {
    next(e);
  }
};

export const getProject: RequestHandler = async (req, res, next) => {
  try {
    const project = await ProjectModel.findById(req.params['id']).lean();
    if (!project) { res.status(404).json({ error: 'Proyecto no encontrado' }); return; }
    res.json(project);
  } catch (e) {
    next(e);
  }
};

export const updateProject: RequestHandler = async (req, res, next) => {
  try {
    const body = schema.partial().parse(req.body);
    const current = await ProjectModel.findById(req.params['id']).lean();
    if (!current) { res.status(404).json({ error: 'Proyecto no encontrado' }); return; }

    const historialEntries: { campo: string; valorAnterior: string; valorNuevo: string; fecha: Date }[] = [];

    if (body.status && current.status !== body.status) {
      historialEntries.push({
        campo: 'status',
        valorAnterior: current.status,
        valorNuevo: body.status,
        fecha: new Date(),
      });
    }
    if (body.name && current.name !== body.name) {
      historialEntries.push({
        campo: 'name',
        valorAnterior: current.name,
        valorNuevo: body.name,
        fecha: new Date(),
      });
    }

    const update = historialEntries.length
      ? { ...body, $push: { historial: { $each: historialEntries } } }
      : body;

    const project = await ProjectModel.findByIdAndUpdate(
      req.params['id'],
      update,
      { new: true, runValidators: true }
    ).lean();
    res.json(project);
  } catch (e) {
    next(e);
  }
};

export const getProjectDocuments: RequestHandler = async (req, res, next) => {
  try {
    const docs = await DocumentModel.find({ projectId: req.params['id'] })
      .sort({ createdAt: -1 })
      .lean();
    res.json(docs);
  } catch (e) {
    next(e);
  }
};
