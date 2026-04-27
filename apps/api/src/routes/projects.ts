import { Router } from 'express';
import {
  listProjects,
  createProject,
  getProject,
  updateProject,
  getProjectDocuments,
} from '../controllers/projectController.js';

const router = Router();

router.get('/', listProjects);
router.post('/', createProject);
router.get('/:id', getProject);
router.put('/:id', updateProject);
router.get('/:id/documents', getProjectDocuments);

export default router;
