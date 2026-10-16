import dotenv from 'dotenv';
dotenv.config();

export const ENV = {
  PORT: process.env.PORT ? parseInt(process.env.PORT, 10) : 5000,
  DATABASE_URL: process.env.DATABASE_URL || 'postgresql://smarttravel:smarttravel@localhost:5432/smarttravel_db?schema=public',
  JWT_SECRET: process.env.JWT_SECRET || 'smarttravel_super_secret_jwt_key_2026_secure_hash',
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',
  NODE_ENV: process.env.NODE_ENV || 'development',
};
