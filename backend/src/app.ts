import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import fs from 'fs';
import apiRoutes from './routes';
import { errorHandler } from './middlewares/errorHandler';

import { isAllowedOrigin } from './config/cors';

export const createApp = (): Express => {
  const app = express();

  // Secure CORS Middleware supporting same-origin deployment & local development
  app.use(
    cors((req, callback) => {
      const origin = req.header('Origin');
      const host = req.header('Host');
      const allowed = isAllowedOrigin(origin, host);
      callback(null, {
        origin: allowed,
        credentials: true,
      });
    })
  );
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());

  // Health check
  app.get('/api/health', (req: Request, res: Response) => {
    res.json({
      status: 'healthy',
      service: 'SmartTravel Backend API',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  });

  // Mount API routes
  app.use('/api', apiRoutes);

  // Serve Frontend build if available
  const frontendDist = path.resolve(__dirname, '../../frontend/dist');
  if (fs.existsSync(frontendDist)) {
    app.use(express.static(frontendDist));
    app.use((req: Request, res: Response) => {
      res.sendFile(path.join(frontendDist, 'index.html'));
    });
  } else {
    // 404 catch-all
    app.use((req: Request, res: Response) => {
      res.status(404).json({
        success: false,
        message: `Route not found: ${req.method} ${req.originalUrl}`,
      });
    });
  }

  // Global Error Handler
  app.use(errorHandler);

  return app;
};

export default createApp;
