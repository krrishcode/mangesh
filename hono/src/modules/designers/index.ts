import { Hono } from 'hono';

export const designersModule = new Hono();

designersModule.get('/', (c) => c.json({ success: true, module: 'designers' }));
