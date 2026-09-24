import { Hono } from 'hono';

export const shippingModule = new Hono();

shippingModule.get('/', (c) => c.json({ success: true, module: 'shipping' }));
