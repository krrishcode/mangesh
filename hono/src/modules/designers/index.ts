import { Hono } from 'hono';
import { db } from '../../db/index.js';
import { designers } from '../../db/schema/index.js';

export const designersModule = new Hono();

designersModule.get('/', async (c) => {
  try {
    const data = await db.select().from(designers);
    return c.json({ success: true, data });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});
