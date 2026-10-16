import { Router } from 'express';
import authRoutes from './auth.routes';
import busRoutes from './bus.routes';
import routeRoutes from './route.routes';
import scheduleRoutes from './schedule.routes';
import bookingRoutes from './booking.routes';
import alarmRoutes from './alarm.routes';
import notificationRoutes from './notification.routes';
import analyticsRoutes from './analytics.routes';

const apiRouter = Router();

apiRouter.use('/auth', authRoutes);
apiRouter.use('/buses', busRoutes);
apiRouter.use('/routes', routeRoutes);
apiRouter.use('/schedules', scheduleRoutes);
apiRouter.use('/bookings', bookingRoutes);
apiRouter.use('/alarms', alarmRoutes);
apiRouter.use('/notifications', notificationRoutes);
apiRouter.use('/analytics', analyticsRoutes);

export default apiRouter;
