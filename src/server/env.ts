import { randomBytes } from 'node:crypto';

const nodeEnv = process.env.NODE_ENV || 'development';

if (nodeEnv === 'production' && (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32)) {
  throw new Error('Configure a JWT_SECRET of at least 32 characters for production.');
}

export const env = {
  nodeEnv,
  isProduction: nodeEnv === 'production',
  appOrigin: process.env.APP_ORIGIN || 'http://localhost:3000',
  jwtSecret: process.env.JWT_SECRET || randomBytes(32).toString('hex'),
} as const;
