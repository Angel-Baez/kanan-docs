import { Router } from 'express';
import { getCalendarEvents } from '../controllers/calendarController.js';

const router = Router();
router.get('/', getCalendarEvents);
export default router;
