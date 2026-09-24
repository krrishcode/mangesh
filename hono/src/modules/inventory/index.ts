import { Hono } from 'hono';

export const inventoryModule = new Hono();

inventoryModule.get('/', (c) => c.json({ success: true, module: 'inventory' }));
