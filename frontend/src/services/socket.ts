import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export const getSocket = (): Socket => {
  if (!socket) {
    const token = localStorage.getItem('token');
    socket = io('/', {
      transports: ['websocket', 'polling'],
      auth: { token },
      autoConnect: true,
    });

    socket.on('connect', () => {
      console.log('⚡ Connected to SmartTravel Real-Time Server:', socket?.id);
    });

    socket.on('disconnect', () => {
      console.log('🔌 Disconnected from Real-Time Server');
    });
  }
  return socket;
};

export const updateSocketAuth = (token: string | null) => {
  if (socket) {
    socket.auth = { token };
    socket.disconnect().connect();
  }
};
