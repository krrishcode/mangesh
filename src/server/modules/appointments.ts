import { and, desc, eq } from 'drizzle-orm';
import { db } from '../db';
import { appointments } from '../db/schema';
import { json, type ApiContext } from '../http/context';
import { createAppointmentSchema, updateAppointmentSchema } from '../validation';

function appointmentData(appointment: typeof appointments.$inferSelect) {
  return {
    id: appointment.id,
    location: appointment.location,
    occasion: appointment.occasion,
    scheduled_at: appointment.scheduledAt,
    status: appointment.status,
    notes: appointment.notes,
  };
}

export async function listAppointments(c: ApiContext) {
  const rows = await db
    .select()
    .from(appointments)
    .where(eq(appointments.userId, c.authUser!.id))
    .orderBy(desc(appointments.scheduledAt));
  return json(c, { success: true, data: rows.map(appointmentData) });
}

export async function createAppointment(c: ApiContext) {
  const parsed = createAppointmentSchema.safeParse(c.body);
  if (!parsed.success) {
    return json(c, { success: false, error: 'Validation failed', details: parsed.error.flatten().fieldErrors }, 400);
  }

  const scheduledAt = new Date(parsed.data.scheduledAt);
  if (!Number.isFinite(scheduledAt.getTime()) || scheduledAt.getTime() <= Date.now()) {
    return json(c, { success: false, error: 'Choose a future appointment date and time' }, 400);
  }

  const [header] = await db.insert(appointments).values({
    userId: c.authUser!.id,
    location: parsed.data.location,
    occasion: parsed.data.occasion,
    scheduledAt,
    notes: parsed.data.notes ?? null,
  });
  const [created] = await db.select().from(appointments).where(eq(appointments.id, header.insertId)).limit(1);
  return json(c, { success: true, data: appointmentData(created), message: 'Appointment booked' }, 201);
}

export async function cancelAppointment(c: ApiContext) {
  const id = Number(c.params.id);
  if (!Number.isSafeInteger(id) || id <= 0) return json(c, { success: false, error: 'Invalid appointment id' }, 400);
  const [updated] = await db
    .update(appointments)
    .set({ status: 'cancelled' })
    .where(and(eq(appointments.id, id), eq(appointments.userId, c.authUser!.id), eq(appointments.status, 'upcoming')));
  if (!updated.affectedRows) return json(c, { success: false, error: 'Upcoming appointment not found' }, 404);
  return json(c, { success: true, message: 'Appointment cancelled' });
}

export async function updateAppointment(c: ApiContext) {
  const id = Number(c.params.id);
  if (!Number.isSafeInteger(id) || id <= 0) return json(c, { success: false, error: 'Invalid appointment id' }, 400);

  const parsed = updateAppointmentSchema.safeParse(c.body);
  if (!parsed.success) {
    return json(c, { success: false, error: 'Validation failed', details: parsed.error.flatten().fieldErrors }, 400);
  }

  const values: Record<string, unknown> = {};
  const owned = and(eq(appointments.id, id), eq(appointments.userId, c.authUser!.id));
  const [existing] = await db.select().from(appointments).where(owned).limit(1);
  if (!existing) return json(c, { success: false, error: 'Appointment not found' }, 404);
  if (existing.status !== 'upcoming') return json(c, { success: false, error: 'Only upcoming appointments can be changed' }, 409);

  if (parsed.data.location !== undefined) values.location = parsed.data.location;
  if (parsed.data.occasion !== undefined) values.occasion = parsed.data.occasion;
  if (parsed.data.scheduledAt !== undefined) {
    const scheduledAt = new Date(parsed.data.scheduledAt);
    if (!Number.isFinite(scheduledAt.getTime()) || scheduledAt.getTime() <= Date.now()) {
      return json(c, { success: false, error: 'Choose a future appointment date and time' }, 400);
    }
    values.scheduledAt = scheduledAt;
  }
  if (parsed.data.notes !== undefined) values.notes = parsed.data.notes;
  if (!Object.keys(values).length) return json(c, { success: false, error: 'No changes supplied' }, 400);

  const [updated] = await db
    .update(appointments)
    .set(values)
    .where(and(owned, eq(appointments.status, 'upcoming')));
  if (!updated.affectedRows) {
    return json(c, { success: false, error: 'Appointment could not be updated. Refresh and try again.' }, 409);
  }

  const [record] = await db.select().from(appointments).where(owned).limit(1);
  if (!record) return json(c, { success: false, error: 'Appointment not found' }, 404);
  return json(c, { success: true, data: appointmentData(record), message: 'Appointment updated' });
}

export async function rescheduleAppointment(c: ApiContext) {
  const id = Number(c.params.id);
  if (!Number.isSafeInteger(id) || id <= 0) return json(c, { success: false, error: 'Invalid appointment id' }, 400);

  const parsed = updateAppointmentSchema.safeParse(c.body);
  if (!parsed.success) {
    return json(c, { success: false, error: 'Validation failed', details: parsed.error.flatten().fieldErrors }, 400);
  }
  if (!parsed.data.scheduledAt) return json(c, { success: false, error: 'scheduledAt is required to reschedule' }, 400);

  const scheduledAt = new Date(parsed.data.scheduledAt);
  if (!Number.isFinite(scheduledAt.getTime()) || scheduledAt.getTime() <= Date.now()) {
    return json(c, { success: false, error: 'Choose a future appointment date and time' }, 400);
  }

  const [updated] = await db
    .update(appointments)
    .set({ scheduledAt })
    .where(and(eq(appointments.id, id), eq(appointments.userId, c.authUser!.id), eq(appointments.status, 'upcoming')));
  if (!updated.affectedRows) return json(c, { success: false, error: 'Upcoming appointment not found' }, 404);
  return json(c, { success: true, message: 'Appointment rescheduled' });
}
