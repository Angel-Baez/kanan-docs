import { Router } from 'express';
import {
  listClients,
  createClient,
  getClient,
  updateClient,
  getClientProjects,
} from '../controllers/clientController.js';

const router = Router();

router.get('/', listClients);
router.post('/', createClient);
router.get('/:id', getClient);
router.put('/:id', updateClient);
router.get('/:id/projects', getClientProjects);

export default router;
