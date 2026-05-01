import { Router } from 'express';
import { listStaff, createStaff, patchStaff, payrollSummary } from '../controllers/staffController.js';

const router = Router();

router.get('/',           listStaff);
router.post('/',          createStaff);
router.patch('/:id',      patchStaff);

// Payroll summary lives on its own prefix: /api/v1/payroll/summary
export const payrollRouter = Router();
payrollRouter.get('/summary', payrollSummary);

export default router;
