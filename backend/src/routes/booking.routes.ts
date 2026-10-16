import { Router } from 'express';
import {
  createBooking,
  cancelBooking,
  getMyBookings,
  getBookingById,
  getAllBookings,
  createBookingSchema,
} from '../controllers/booking.controller';
import { authenticate, requireRole } from '../middlewares/auth';
import { validate } from '../middlewares/validate';

const router = Router();

router.post('/', authenticate, validate(createBookingSchema), createBooking);
router.get('/my-bookings', authenticate, getMyBookings);
router.get('/:id', authenticate, getBookingById);
router.post('/:id/cancel', authenticate, cancelBooking);

// Admin-only endpoints
router.get('/', authenticate, requireRole('ADMIN'), getAllBookings);

export default router;
