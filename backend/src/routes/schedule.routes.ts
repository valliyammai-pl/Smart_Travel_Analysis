import { Router } from 'express';
import {
  searchSchedules,
  getScheduleById,
  createSchedule,
  updateSchedule,
  deleteSchedule,
  createScheduleSchema,
} from '../controllers/schedule.controller';
import { authenticate, requireRole } from '../middlewares/auth';
import { validate } from '../middlewares/validate';

const router = Router();

router.get('/', searchSchedules);
router.get('/:id', getScheduleById);

// Admin-only endpoints
router.post('/', authenticate, requireRole('ADMIN'), validate(createScheduleSchema), createSchedule);
router.put('/:id', authenticate, requireRole('ADMIN'), updateSchedule);
router.delete('/:id', authenticate, requireRole('ADMIN'), deleteSchedule);

export default router;
