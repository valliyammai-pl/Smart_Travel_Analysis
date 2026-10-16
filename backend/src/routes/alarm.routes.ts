import { Router } from 'express';
import {
  getUserAlarms,
  createAlarm,
  dismissAlarm,
  resetAlarm,
  testTriggerThreshold,
  createAlarmSchema,
} from '../controllers/alarm.controller';
import { authenticate } from '../middlewares/auth';
import { validate } from '../middlewares/validate';

const router = Router();

router.get('/', authenticate, getUserAlarms);
router.post('/', authenticate, validate(createAlarmSchema), createAlarm);
router.patch('/:id/dismiss', authenticate, dismissAlarm);
router.patch('/:id/reset', authenticate, resetAlarm);
router.post('/:id/test-trigger', authenticate, testTriggerThreshold);

export default router;
