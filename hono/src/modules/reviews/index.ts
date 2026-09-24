import { Hono } from 'hono';

export const reviewsModule = new Hono();

reviewsModule.get('/', (c) => c.json({ success: true, module: 'reviews' }));
