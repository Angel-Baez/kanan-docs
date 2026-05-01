import { Router } from 'express';
import { authorize } from '../middleware/authorize.js';
import {
  getCompany, updateCompany,
  listUsers, createUser, patchUser, resetUserPassword,
  updateMe, changePassword,
} from '../controllers/settingsController.js';

const router = Router();

// Company — read: any role; write: admin only
router.get('/company',  getCompany);
router.put('/company',  authorize('admin'), updateCompany);

// Users — admin only
router.get('/users',              authorize('admin'), listUsers);
router.post('/users',             authorize('admin'), createUser);
router.patch('/users/:id',        authorize('admin'), patchUser);
router.post('/users/:id/password',authorize('admin'), resetUserPassword);

// Self
router.patch('/me',          updateMe);
router.post('/me/password',  changePassword);

export default router;
