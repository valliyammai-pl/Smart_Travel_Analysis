import { Router } from 'express';
import {
  getAllBuses,
  getBusById,
  createBus,
  updateBus,
  deleteBus,
  toggleBusSimulation,
  createBusSchema,
  updateBusSchema,
} from '../controllers/bus.controller';
import { authenticate, requireRole } from '../middlewares/auth';
import { validate } from '../middlewares/validate';

const router = Router();

router.get('/', getAllBuses);
router.get('/:id', getBusById);

// Admin-only endpoints
router.post('/', authenticate, requireRole('ADMIN'), validate(createBusSchema), createBus);
router.put('/:id', authenticate, requireRole('ADMIN'), validate(updateBusSchema), updateBus);
router.delete('/:id', authenticate, requireRole('ADMIN'), deleteBus);
router.post('/:id/toggle-simulation', authenticate, requireRole('ADMIN'), toggleBusSimulation);

export default router;
