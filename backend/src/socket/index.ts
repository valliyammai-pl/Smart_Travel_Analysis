import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { ENV } from '../config/env';
import { UserPayload } from '../types';

import { isAllowedOrigin } from '../config/cors';

let ioInstance: Server | null = null;

export const initSocket = (server: HttpServer): Server => {
  const io = new Server(server, {
    cors: {
      origin: (origin, callback) => {
        if (isAllowedOrigin(origin)) {
          callback(null, true);
        } else {
          callback(new Error('Cross-Origin Request Blocked by SmartTravel CORS Policy'));
        }
      },
      methods: ['GET', 'POST'],
      credentials: true,
    },
    allowRequest: (req, callback) => {
      const origin = req.headers.origin;
      const host = req.headers.host;
      const allowed = isAllowedOrigin(origin, host);
      callback(null, allowed);
    },
    transports: ['websocket', 'polling'],
  });

  io.use((socket: Socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];
    if (token) {
      try {
        const decoded = jwt.verify(token, ENV.JWT_SECRET) as UserPayload;
        (socket as any).user = decoded;
      } catch (err) {
        // Allow unauthenticated connection for public bus tracking
      }
    }
    next();
  });

  io.on('connection', (socket: Socket) => {
    const user = (socket as any).user as UserPayload | undefined;
    console.log(`🔌 Socket connected: ${socket.id} ${user ? `(User: ${user.email})` : '(Anonymous)'}`);

    // If authenticated, automatically join their user-specific room
    if (user?.userId) {
      socket.join(`user_${user.userId}`);
    }

    // Client can explicitly join a user room if they provided userId
    socket.on('join_user', (userId: string) => {
      if (userId) {
        socket.join(`user_${userId}`);
      }
    });

    // Client joins tracking room for a specific bus
    socket.on('join_bus', (busId: string) => {
      if (busId) {
        socket.join(`bus_${busId}`);
      }
    });

    socket.on('leave_bus', (busId: string) => {
      if (busId) {
        socket.leave(`bus_${busId}`);
      }
    });

    // Client joins global fleet overview
    socket.on('join_all_buses', () => {
      socket.join('all_buses');
    });

    socket.on('leave_all_buses', () => {
      socket.leave('all_buses');
    });

    socket.on('disconnect', () => {
      // Disconnect cleanly
    });
  });

  ioInstance = io;
  return io;
};

export const getIO = (): Server => {
  if (!ioInstance) {
    throw new Error('Socket.IO has not been initialized yet!');
  }
  return ioInstance;
};
