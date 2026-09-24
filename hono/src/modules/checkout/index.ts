import { Hono } from 'hono';

export const checkoutModule = new Hono();

checkoutModule.get('/', (c) => c.json({ success: true, module: 'checkout' }));
