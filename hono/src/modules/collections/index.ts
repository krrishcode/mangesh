import { Hono } from 'hono';

export const collectionsModule = new Hono();

collectionsModule.get('/', (c) => c.json({ success: true, module: 'collections' }));
