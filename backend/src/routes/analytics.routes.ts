import { Router } from 'express';
import { getAdminAnalytics } from '../controllers/analytics.controller';
import { authenticate, requireRole } from '../middlewares/auth';

const router = Router();

router.get('/', authenticate, requireRole('ADMIN'), getAdminAnalytics);

export default router;
