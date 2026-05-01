import { Router } from 'express';
import { getCompanySummary } from '../controllers/financialController.js';

const router = Router();
router.get('/summary', getCompanySummary);
export default router;
