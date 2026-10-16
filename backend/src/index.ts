import http from 'http';
import createApp from './app';
import { initSocket } from './socket';
import { startGpsSimulator, stopGpsSimulator } from './services/gpsSimulator.service';
import { ENV } from './config/env';
import { prisma } from './config/db';

const app = createApp();
const server = http.createServer(app);

// Initialize Socket.IO
initSocket(server);

// Start HTTP & WebSocket server
server.listen(ENV.PORT, () => {
  console.log(`🚌 SmartTravel Server running on http://localhost:${ENV.PORT}`);
  console.log(`📊 Health check available at http://localhost:${ENV.PORT}/api/health`);

  // Start GPS Simulation engine (updates every 3 seconds)
  startGpsSimulator(3000);
});

// Graceful shutdown handling
const handleShutdown = async (signal: string) => {
  console.log(`\n🛑 Received ${signal}, shutting down gracefully...`);
  stopGpsSimulator();
  server.close(async () => {
    console.log('🔌 HTTP/Socket server closed');
    await prisma.$disconnect();
    console.log('🗄️ PostgreSQL connection closed');
    process.exit(0);
  });
};

process.on('SIGINT', () => handleShutdown('SIGINT'));
process.on('SIGTERM', () => handleShutdown('SIGTERM'));
