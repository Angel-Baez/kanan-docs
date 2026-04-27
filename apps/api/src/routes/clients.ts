import { Router } from 'express';
import {
  listClients,
  createClient,
  getClient,
  updateClient,
} from '../controllers/clientController.js';

const router = Router();

router.get('/', listClients);
router.post('/', createClient);
router.get('/:id', getClient);
router.put('/:id', updateClient);

export default router;
