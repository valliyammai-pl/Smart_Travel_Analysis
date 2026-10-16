import dotenv from 'dotenv';
dotenv.config();

const NODE_ENV = process.env.NODE_ENV || 'development';
const isProduction = NODE_ENV === 'production';
const DEV_DEFAULT_JWT_SECRET = 'smarttravel_super_secret_jwt_key_2026_secure_hash';

// Validate production configuration
if (isProduction) {
  const missing: string[] = [];

  if (!process.env.DATABASE_URL) {
    missing.push('DATABASE_URL');
  }

  if (!process.env.JWT_SECRET) {
    missing.push('JWT_SECRET');
  } else if (process.env.JWT_SECRET === DEV_DEFAULT_JWT_SECRET) {
    throw new Error(
      'FATAL: The development default JWT_SECRET is not permitted in production. Please set a strong, random JWT_SECRET.'
    );
  }

  if (missing.length > 0) {
    throw new Error(
      `FATAL: Missing required production environment variable(s): ${missing.join(', ')}`
    );
  }
}

export const ENV = {
  PORT: process.env.PORT ? parseInt(process.env.PORT, 10) : 5000,
  DATABASE_URL: process.env.DATABASE_URL || 'postgresql://smarttravel:smarttravel@localhost:5432/smarttravel_db?schema=public',
  DIRECT_URL: process.env.DIRECT_URL || process.env.DATABASE_URL || 'postgresql://smarttravel:smarttravel@localhost:5432/smarttravel_db?schema=public',
  JWT_SECRET: process.env.JWT_SECRET || DEV_DEFAULT_JWT_SECRET,
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',
  NODE_ENV,
  INITIAL_ADMIN_EMAIL: process.env.INITIAL_ADMIN_EMAIL || '',
  INITIAL_ADMIN_PASSWORD: process.env.INITIAL_ADMIN_PASSWORD || '',
  ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS || '',
};

