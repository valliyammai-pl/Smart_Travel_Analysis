import { Router } from 'express';
import { register, login, getProfile, logout, registerSchema, loginSchema } from '../controllers/auth.controller';
import { authenticate } from '../middlewares/auth';
import { validate } from '../middlewares/validate';

const router = Router();

router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);
router.get('/me', authenticate, getProfile);
router.post('/logout', logout);

export default router;
