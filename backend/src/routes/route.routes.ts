import { Router } from 'express';
import {
  getAllRoutes,
  getRouteById,
  createRoute,
  deleteRoute,
  createRouteSchema,
} from '../controllers/route.controller';
import { authenticate, requireRole } from '../middlewares/auth';
import { validate } from '../middlewares/validate';

const router = Router();

router.get('/', getAllRoutes);
router.get('/:id', getRouteById);

// Admin-only endpoints
router.post('/', authenticate, requireRole('ADMIN'), validate(createRouteSchema), createRoute);
router.delete('/:id', authenticate, requireRole('ADMIN'), deleteRoute);

export default router;
