import { Hono } from 'hono';

export const categoriesModule = new Hono();

categoriesModule.get('/', (c) => c.json({ success: true, module: 'categories' }));
