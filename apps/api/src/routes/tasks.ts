import { Router } from 'express';
import { listTasks } from '../controllers/taskController.js';

const router = Router();
router.get('/', listTasks);
export default router;
