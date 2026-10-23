import '../load-env';
import { eq } from 'drizzle-orm';
import { db, connectionPool } from '../index';
import { users } from '../schema';
import { hashPassword } from '../../lib/password';
import { z } from 'zod';

// Explicit provisioning only. Never creates a demo account or overwrites users.
try {
  const input = z.object({ email: z.string().email(), password: z.string().min(12), name: z.string().trim().min(2) }).parse({ email: process.env.ADMIN_EMAIL, password: process.env.ADMIN_PASSWORD, name: process.env.ADMIN_NAME });
  const email = input.email.toLowerCase().trim();
  const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
  if (existing) throw new Error('That email is already registered. No account was changed.');
  await db.insert(users).values({ email, name: input.name, passwordHash: await hashPassword(input.password), role: 'admin' });
  console.log('Administrator created.');
} finally { await connectionPool.end(); }
