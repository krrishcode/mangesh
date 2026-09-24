import { Hono } from 'hono';

export const cartModule = new Hono();

cartModule.get('/', (c) => c.json({ success: true, module: 'cart' }));
