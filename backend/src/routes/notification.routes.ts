import { Router } from 'express';
import {
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  clearNotifications,
} from '../controllers/notification.controller';
import { authenticate } from '../middlewares/auth';

const router = Router();

router.get('/', authenticate, getUserNotifications);
router.patch('/:id/read', authenticate, markAsRead);
router.patch('/read-all', authenticate, markAllAsRead);
router.delete('/', authenticate, clearNotifications);

export default router;
