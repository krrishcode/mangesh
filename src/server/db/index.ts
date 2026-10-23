import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import { env } from '../env';
import * as schema from './schema';

// Serverless instances are reused, so the pool is cached on the global object
// instead of being recreated on every module evaluation.
const globalForDb = globalThis as unknown as { __mmMysqlPool?: mysql.Pool };

export const connectionPool =
  globalForDb.__mmMysqlPool ??
  mysql.createPool({
    host: env.db.host,
    port: env.db.port,
    user: env.db.user,
    password: env.db.password,
    database: env.db.database,
    waitForConnections: true,
    connectionLimit: env.db.connectionLimit,
    queueLimit: 0,
    enableKeepAlive: true,
  });

if (!globalForDb.__mmMysqlPool) globalForDb.__mmMysqlPool = connectionPool;

export const db = drizzle(connectionPool, { schema, mode: 'default' });

export async function checkDatabase(): Promise<boolean> {
  try {
    const connection = await connectionPool.getConnection();
    connection.release();
    return true;
  } catch (error) {
    console.error('Database connection error:', error);
    return false;
  }
}
