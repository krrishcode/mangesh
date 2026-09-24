import { Hono } from 'hono';
import { eq, and, desc } from 'drizzle-orm';
import { db } from '../../db/index.js';
import { users, addresses, userMeasurements } from '../../db/schema/index.js';
import { updateProfileSchema, updateMeasurementsSchema, createAddressSchema, updateAddressSchema, changePasswordSchema } from '../../validation/index.js';
import { requireAuth } from '../../middleware/auth.js';
import { verifyPassword, hashPassword } from '../../lib/auth.js';

export const usersModule = new Hono();

usersModule.use('*', requireAuth);

function publicUser(user: typeof users.$inferSelect) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    phone: user.phone,
    role: user.role,
    created_at: user.createdAt,
  };
}

// ---- Profile ----
usersModule.get('/me', async (c) => {
  const authUser = c.get('authUser');
  const [user] = await db.select().from(users).where(eq(users.id, authUser.id)).limit(1);
  if (!user) return c.json({ success: false, error: 'User not found' }, 404);
  return c.json({ success: true, data: publicUser(user) });
});

usersModule.put('/me', async (c) => {
  const authUser = c.get('authUser');
  const body = await c.req.json().catch(() => null);
  const parsed = updateProfileSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ success: false, error: 'Validation failed', details: parsed.error.flatten().fieldErrors }, 400);
  }

  const [updated] = await db.update(users).set(parsed.data).where(eq(users.id, authUser.id));
  if (!updated) return c.json({ success: false, error: 'User not found' }, 404);
  const [synced] = await db.select().from(users).where(eq(users.id, authUser.id)).limit(1);
  return c.json({ success: true, data: publicUser(synced), message: 'Profile updated' });
});

// ---- Change Password ----
usersModule.post('/me/change-password', async (c) => {
  const authUser = c.get('authUser');
  const body = await c.req.json().catch(() => null);
  const parsed = changePasswordSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ success: false, error: 'Validation failed', details: parsed.error.flatten().fieldErrors }, 400);
  }

  const [user] = await db.select().from(users).where(eq(users.id, authUser.id)).limit(1);
  if (!user) return c.json({ success: false, error: 'User not found' }, 404);

  if (!(await verifyPassword(parsed.data.currentPassword, user.passwordHash))) {
    return c.json({ success: false, error: 'Current password is incorrect' }, 400);
  }

  const passwordHash = await hashPassword(parsed.data.newPassword);
  await db.update(users).set({ passwordHash }).where(eq(users.id, authUser.id));

  return c.json({ success: true, message: 'Password updated' });
});

// ---- Haute Couture Measurements ----
usersModule.get('/me/measurements', async (c) => {
  const authUser = c.get('authUser');
  const [record] = await db
    .select()
    .from(userMeasurements)
    .where(eq(userMeasurements.userId, authUser.id))
    .limit(1);
  return c.json({ success: true, data: record ?? null });
});

usersModule.put('/me/measurements', async (c) => {
  const authUser = c.get('authUser');
  const body = await c.req.json().catch(() => null);
  const parsed = updateMeasurementsSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ success: false, error: 'Validation failed', details: parsed.error.flatten().fieldErrors }, 400);
  }

  const { unit, ...dims } = parsed.data;
  const values: Record<string, unknown> = { userId: authUser.id };
  for (const [key, value] of Object.entries(dims)) {
    if (value !== undefined) values[key] = value === null ? null : String(value);
  }
  if (unit !== undefined) values.unit = unit;

  const [existing] = await db
    .select({ id: userMeasurements.id })
    .from(userMeasurements)
    .where(eq(userMeasurements.userId, authUser.id))
    .limit(1);

  if (existing) {
    const [updated] = await db
      .update(userMeasurements)
      .set(values)
      .where(eq(userMeasurements.id, existing.id));
    return c.json({ success: true, data: updated, message: 'Measurements updated' });
  }

  const [header] = await db.insert(userMeasurements).values(values as typeof userMeasurements.$inferInsert);
  const [created] = await db.select().from(userMeasurements).where(eq(userMeasurements.id, header.insertId)).limit(1);
  return c.json({ success: true, data: created, message: 'Measurements saved' }, 201);
});

// ---- Address Book ----
usersModule.get('/me/addresses', async (c) => {
  const authUser = c.get('authUser');
  const rows = await db
    .select()
    .from(addresses)
    .where(eq(addresses.userId, authUser.id))
    .orderBy(desc(addresses.isDefault), desc(addresses.id));
  return c.json({ success: true, data: rows });
});

usersModule.post('/me/addresses', async (c) => {
  const authUser = c.get('authUser');
  const body = await c.req.json().catch(() => null);
  const parsed = createAddressSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ success: false, error: 'Validation failed', details: parsed.error.flatten().fieldErrors }, 400);
  }

  const values = { ...parsed.data, userId: authUser.id };

  // Only one default per label: clear previous defaults of the same label when this one is default.
  if (values.isDefault) {
    await db
      .update(addresses)
      .set({ isDefault: false })
      .where(and(eq(addresses.userId, authUser.id), eq(addresses.label, values.label)));
  }

  const [header] = await db.insert(addresses).values(values);
  const [created] = await db.select().from(addresses).where(eq(addresses.id, header.insertId)).limit(1);
  return c.json({ success: true, data: created, message: 'Address added' }, 201);
});

usersModule.put('/me/addresses/:id', async (c) => {
  const authUser = c.get('authUser');
  const id = Number(c.req.param('id'));
  if (!Number.isInteger(id)) return c.json({ success: false, error: 'Invalid address id' }, 400);

  const body = await c.req.json().catch(() => null);
  const parsed = updateAddressSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ success: false, error: 'Validation failed', details: parsed.error.flatten().fieldErrors }, 400);
  }

  if (parsed.data.isDefault && parsed.data.label) {
    await db
      .update(addresses)
      .set({ isDefault: false })
      .where(and(eq(addresses.userId, authUser.id), eq(addresses.label, parsed.data.label)));
  }

  const [updated] = await db
    .update(addresses)
    .set(parsed.data)
    .where(and(eq(addresses.id, id), eq(addresses.userId, authUser.id)));

  if (!updated) return c.json({ success: false, error: 'Address not found' }, 404);
  return c.json({ success: true, data: updated, message: 'Address updated' });
});

usersModule.delete('/me/addresses/:id', async (c) => {
  const authUser = c.get('authUser');
  const id = Number(c.req.param('id'));
  if (!Number.isInteger(id)) return c.json({ success: false, error: 'Invalid address id' }, 400);

  const [deleted] = await db
    .delete(addresses)
    .where(and(eq(addresses.id, id), eq(addresses.userId, authUser.id)));

  if (!deleted) return c.json({ success: false, error: 'Address not found' }, 404);
  return c.json({ success: true, message: 'Address removed' });
});
