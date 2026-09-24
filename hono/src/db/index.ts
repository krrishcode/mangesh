import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import { env } from '../config/index.js';
import * as schema from './schema/index.js';

export const connectionPool = mysql.createPool({
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

// Initialized Drizzle ORM Instance with full relational schema typing
export const db = drizzle(connectionPool, { schema, mode: 'default' });

export async function checkDatabase(): Promise<boolean> {
  try {
    const conn = await connectionPool.getConnection();
    conn.release();
    return true;
  } catch (err) {
    console.error('Database connection error:', err);
    return false;
  }
}
