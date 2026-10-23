import { and, desc, eq } from 'drizzle-orm';
import { db } from '../db';
import { addresses, passwordResetTokens, userMeasurements, users } from '../db/schema';
import { json, type ApiContext } from '../http/context';
import { AppError } from '../lib/errors';
import { hashPassword, verifyPassword } from '../lib/password';
import {
  changePasswordSchema,
  createAddressSchema,
  updateAddressSchema,
  updateMeasurementsSchema,
  updateProfileSchema,
} from '../validation';

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

export async function getProfile(c: ApiContext) {
  const [user] = await db.select().from(users).where(eq(users.id, c.authUser!.id)).limit(1);
  if (!user) return json(c, { success: false, error: 'User not found' }, 404);
  return json(c, { success: true, data: publicUser(user) });
}

export async function updateProfile(c: ApiContext) {
  const parsed = updateProfileSchema.safeParse(c.body);
  if (!parsed.success) {
    return json(c, { success: false, error: 'Validation failed', details: parsed.error.flatten().fieldErrors }, 400);
  }
  if (!Object.keys(parsed.data).length) return json(c, { success: false, error: 'No changes supplied' }, 400);

  await db.update(users).set(parsed.data).where(eq(users.id, c.authUser!.id));
  const [synced] = await db.select().from(users).where(eq(users.id, c.authUser!.id)).limit(1);
  if (!synced) return json(c, { success: false, error: 'User not found' }, 404);
  return json(c, { success: true, data: publicUser(synced), message: 'Profile updated' });
}

export async function changePassword(c: ApiContext) {
  const parsed = changePasswordSchema.safeParse(c.body);
  if (!parsed.success) {
    return json(c, { success: false, error: 'Validation failed', details: parsed.error.flatten().fieldErrors }, 400);
  }

  const [user] = await db.select().from(users).where(eq(users.id, c.authUser!.id)).limit(1);
  if (!user) return json(c, { success: false, error: 'User not found' }, 404);
  if (!(await verifyPassword(parsed.data.currentPassword, user.passwordHash))) {
    return json(c, { success: false, error: 'Current password is incorrect' }, 400);
  }

  const passwordHash = await hashPassword(parsed.data.newPassword);
  await db.transaction(async (tx) => {
    const [result] = await tx
      .update(users)
      .set({ passwordHash })
      .where(and(eq(users.id, c.authUser!.id), eq(users.passwordHash, user.passwordHash)));
    if (!result.affectedRows) throw new AppError(409, 'Your password changed. Sign in and try again.');
    await tx.update(passwordResetTokens).set({ usedAt: new Date() }).where(eq(passwordResetTokens.userId, c.authUser!.id));
  });

  return json(c, { success: true, message: 'Password updated' });
}

export async function getMeasurements(c: ApiContext) {
  const [record] = await db
    .select()
    .from(userMeasurements)
    .where(eq(userMeasurements.userId, c.authUser!.id))
    .limit(1);
  return json(c, { success: true, data: record ?? null });
}

export async function updateMeasurements(c: ApiContext) {
  const parsed = updateMeasurementsSchema.safeParse(c.body);
  if (!parsed.success) {
    return json(c, { success: false, error: 'Validation failed', details: parsed.error.flatten().fieldErrors }, 400);
  }

  const { unit, ...dims } = parsed.data;
  const values: Record<string, unknown> = { userId: c.authUser!.id };
  for (const [key, value] of Object.entries(dims)) {
    if (value !== undefined) values[key] = value === null ? null : String(value);
  }
  if (unit !== undefined) values.unit = unit;

  const [existing] = await db
    .select({ id: userMeasurements.id })
    .from(userMeasurements)
    .where(eq(userMeasurements.userId, c.authUser!.id))
    .limit(1);

  if (existing) {
    await db.update(userMeasurements).set(values).where(eq(userMeasurements.id, existing.id));
    const [record] = await db.select().from(userMeasurements).where(eq(userMeasurements.id, existing.id)).limit(1);
    return json(c, { success: true, data: record, message: 'Measurements updated' });
  }

  const [header] = await db.insert(userMeasurements).values(values as typeof userMeasurements.$inferInsert);
  const [created] = await db.select().from(userMeasurements).where(eq(userMeasurements.id, header.insertId)).limit(1);
  return json(c, { success: true, data: created, message: 'Measurements saved' }, 201);
}

export async function listAddresses(c: ApiContext) {
  const rows = await db
    .select()
    .from(addresses)
    .where(eq(addresses.userId, c.authUser!.id))
    .orderBy(desc(addresses.isDefault), desc(addresses.id));
  return json(c, { success: true, data: rows });
}

export async function createAddress(c: ApiContext) {
  const parsed = createAddressSchema.safeParse(c.body);
  if (!parsed.success) {
    return json(c, { success: false, error: 'Validation failed', details: parsed.error.flatten().fieldErrors }, 400);
  }

  const created = await db.transaction(async (tx) => {
    await tx.select({ id: users.id }).from(users).where(eq(users.id, c.authUser!.id)).for('update');
    const values = { ...parsed.data, userId: c.authUser!.id };
    if (values.isDefault) {
      await tx
        .update(addresses)
        .set({ isDefault: false })
        .where(and(eq(addresses.userId, c.authUser!.id), eq(addresses.label, values.label)));
    }
    const [header] = await tx.insert(addresses).values(values);
    const [record] = await tx
      .select()
      .from(addresses)
      .where(and(eq(addresses.id, header.insertId), eq(addresses.userId, c.authUser!.id)))
      .limit(1);
    return record;
  });
  return json(c, { success: true, data: created, message: 'Address added' }, 201);
}

export async function updateAddress(c: ApiContext) {
  const id = Number(c.params.id);
  if (!Number.isSafeInteger(id) || id <= 0) return json(c, { success: false, error: 'Invalid address id' }, 400);

  const parsed = updateAddressSchema.safeParse(c.body);
  if (!parsed.success) {
    return json(c, { success: false, error: 'Validation failed', details: parsed.error.flatten().fieldErrors }, 400);
  }
  if (!Object.keys(parsed.data).length) return json(c, { success: false, error: 'No changes supplied' }, 400);

  const updated = await db.transaction(async (tx) => {
    await tx.select({ id: users.id }).from(users).where(eq(users.id, c.authUser!.id)).for('update');
    const owned = and(eq(addresses.id, id), eq(addresses.userId, c.authUser!.id));
    const [existing] = await tx.select().from(addresses).where(owned).limit(1).for('update');
    if (!existing) throw new AppError(404, 'Address not found');
    const next = { ...existing, ...parsed.data };
    if (next.isDefault) {
      await tx
        .update(addresses)
        .set({ isDefault: false })
        .where(and(eq(addresses.userId, c.authUser!.id), eq(addresses.label, next.label)));
    }
    await tx.update(addresses).set({ ...parsed.data, isDefault: next.isDefault }).where(owned);
    const [record] = await tx.select().from(addresses).where(owned).limit(1);
    return record;
  });
  return json(c, { success: true, data: updated, message: 'Address updated' });
}

export async function deleteAddress(c: ApiContext) {
  const id = Number(c.params.id);
  if (!Number.isSafeInteger(id) || id <= 0) return json(c, { success: false, error: 'Invalid address id' }, 400);

  const [deleted] = await db
    .delete(addresses)
    .where(and(eq(addresses.id, id), eq(addresses.userId, c.authUser!.id)));
  if (!deleted.affectedRows) return json(c, { success: false, error: 'Address not found' }, 404);
  return json(c, { success: true, message: 'Address removed' });
}
