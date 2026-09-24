import { Hono } from 'hono';
import { eq, and, desc } from 'drizzle-orm';
import { db } from '../../db/index.js';
import { appointments } from '../../db/schema/index.js';
import { createAppointmentSchema, updateAppointmentSchema } from '../../validation/index.js';
import { requireAuth } from '../../middleware/auth.js';

export const appointmentsModule = new Hono();

appointmentsModule.use('*', requireAuth);

// List the authenticated customer's bespoke appointments
appointmentsModule.get('/', async (c) => {
  const authUser = c.get('authUser');
  const rows = await db
    .select()
    .from(appointments)
    .where(eq(appointments.userId, authUser.id))
    .orderBy(desc(appointments.scheduledAt));

  return c.json({
    success: true,
    data: rows.map((apt) => ({
      id: apt.id,
      location: apt.location,
      occasion: apt.occasion,
      scheduled_at: apt.scheduledAt,
      status: apt.status,
      notes: apt.notes,
    })),
  });
});

// Book a new atelier appointment
appointmentsModule.post('/', async (c) => {
  const authUser = c.get('authUser');
  const body = await c.req.json().catch(() => null);
  const parsed = createAppointmentSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ success: false, error: 'Validation failed', details: parsed.error.flatten().fieldErrors }, 400);
  }

  const scheduledAt = new Date(parsed.data.scheduledAt);
  if (Number.isNaN(scheduledAt.getTime())) {
    return c.json({ success: false, error: 'Invalid appointment date' }, 400);
  }

  const [header] = await db.insert(appointments).values({
    userId: authUser.id,
    location: parsed.data.location,
    occasion: parsed.data.occasion,
    scheduledAt,
    notes: parsed.data.notes ?? null,
  });

  const [created] = await db.select().from(appointments).where(eq(appointments.id, header.insertId)).limit(1);

  return c.json(
    {
      success: true,
      data: {
        id: created.id,
        location: created.location,
        occasion: created.occasion,
        scheduled_at: created.scheduledAt,
        status: created.status,
        notes: created.notes,
      },
      message: 'Appointment booked',
    },
    201
  );
});

// Cancel an upcoming appointment
appointmentsModule.patch('/:id/cancel', async (c) => {
  const authUser = c.get('authUser');
  const id = Number(c.req.param('id'));
  if (!Number.isInteger(id)) return c.json({ success: false, error: 'Invalid appointment id' }, 400);

  const [updated] = await db
    .update(appointments)
    .set({ status: 'cancelled' })
    .where(and(eq(appointments.id, id), eq(appointments.userId, authUser.id), eq(appointments.status, 'upcoming')));

  if (!updated) return c.json({ success: false, error: 'Upcoming appointment not found' }, 404);
  return c.json({ success: true, message: 'Appointment cancelled' });
});

// Update an appointment (location, occasion, scheduledAt, notes)
appointmentsModule.put('/:id', async (c) => {
  const authUser = c.get('authUser');
  const id = Number(c.req.param('id'));
  if (!Number.isInteger(id)) return c.json({ success: false, error: 'Invalid appointment id' }, 400);

  const body = await c.req.json().catch(() => null);
  const parsed = updateAppointmentSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ success: false, error: 'Validation failed', details: parsed.error.flatten().fieldErrors }, 400);
  }

  const values: Record<string, unknown> = {};
  if (parsed.data.location !== undefined) values.location = parsed.data.location;
  if (parsed.data.occasion !== undefined) values.occasion = parsed.data.occasion;
  if (parsed.data.scheduledAt !== undefined) {
    const scheduledAt = new Date(parsed.data.scheduledAt);
    if (Number.isNaN(scheduledAt.getTime())) {
      return c.json({ success: false, error: 'Invalid appointment date' }, 400);
    }
    values.scheduledAt = scheduledAt;
  }
  if (parsed.data.notes !== undefined) values.notes = parsed.data.notes;

  const [updated] = await db
    .update(appointments)
    .set(values)
    .where(and(eq(appointments.id, id), eq(appointments.userId, authUser.id)));

  if (!updated) return c.json({ success: false, error: 'Appointment not found' }, 404);

  const [record] = await db.select().from(appointments).where(eq(appointments.id, id)).limit(1);
  return c.json({ success: true, data: {
    id: record.id,
    location: record.location,
    occasion: record.occasion,
    scheduled_at: record.scheduledAt,
    status: record.status,
    notes: record.notes,
  }, message: 'Appointment updated' });
});

// Reschedule an upcoming appointment (only the date/time)
appointmentsModule.patch('/:id/reschedule', async (c) => {
  const authUser = c.get('authUser');
  const id = Number(c.req.param('id'));
  if (!Number.isInteger(id)) return c.json({ success: false, error: 'Invalid appointment id' }, 400);

  const body = await c.req.json().catch(() => null);
  const parsed = updateAppointmentSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ success: false, error: 'Validation failed', details: parsed.error.flatten().fieldErrors }, 400);
  }

  if (!parsed.data.scheduledAt) {
    return c.json({ success: false, error: 'scheduledAt is required to reschedule' }, 400);
  }

  const scheduledAt = new Date(parsed.data.scheduledAt);
  if (Number.isNaN(scheduledAt.getTime())) {
    return c.json({ success: false, error: 'Invalid appointment date' }, 400);
  }

  const [updated] = await db
    .update(appointments)
    .set({ scheduledAt })
    .where(and(eq(appointments.id, id), eq(appointments.userId, authUser.id), eq(appointments.status, 'upcoming')));

  if (!updated) return c.json({ success: false, error: 'Upcoming appointment not found' }, 404);
  return c.json({ success: true, message: 'Appointment rescheduled' });
});
