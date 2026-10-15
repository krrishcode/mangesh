import { Hono } from 'hono';
import { db } from '../../db/index.js';
import { categories } from '../../db/schema/index.js';

export const categoriesModule = new Hono();

categoriesModule.get('/', async (c) => {
  try {
    const data = await db.select().from(categories);
    return c.json({ success: true, data });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});
