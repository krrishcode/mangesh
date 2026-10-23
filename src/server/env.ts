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
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'ecommerce',
    connectionLimit: Math.max(1, Number(process.env.DB_CONN_LIMIT) || 5),
  },
} as const;
