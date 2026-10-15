import { Hono } from 'hono';
import { db } from '../../db/index.js';
import { collections } from '../../db/schema/index.js';

export const collectionsModule = new Hono();

collectionsModule.get('/', async (c) => {
  try {
    const data = await db.select().from(collections);
    return c.json({ success: true, data });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});
