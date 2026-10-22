import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { bodyLimit } from 'hono/body-limit';
import { env } from './config/index.js';
import { errorHandler } from './middleware/index.js';
import { checkDatabase } from './db/index.js';

// Import domain modules
import { authModule } from './modules/auth/index.js';
import { usersModule } from './modules/users/index.js';
import { productsModule } from './modules/products/index.js';
import { categoriesModule } from './modules/categories/index.js';
import { designersModule } from './modules/designers/index.js';
import { collectionsModule } from './modules/collections/index.js';
import { checkoutModule } from './modules/checkout/index.js';
import { ordersModule } from './modules/orders/index.js';
import { paymentsModule } from './modules/payments/index.js';
import { shippingModule } from './modules/shipping/index.js';
import { reviewsModule } from './modules/reviews/index.js';
import { wishlistModule } from './modules/wishlist/index.js';
import { mediaModule } from './modules/media/index.js';
import { appointmentsModule } from './modules/appointments/index.js';
import { adminModule } from './modules/admin/index.js';

export const app = new Hono();

// Global Middlewares
app.use('*', logger());
app.use('*', async (c, next) => { c.header('X-Content-Type-Options', 'nosniff'); c.header('Cache-Control', 'no-store'); await next(); });
const jsonLimit = bodyLimit({ maxSize: 1024 * 1024, onError: c => c.json({ success: false, error: 'Request is too large' }, 413) });
app.use('/api/*', async (c, next) => c.req.path === '/api/media/upload' ? next() : jsonLimit(c, next));
app.use(
  '*',
  cors({
    origin: env.corsOrigin,
    allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
  })
);

// Serve static uploaded media files
app.use('/uploads/*', serveStatic({ root: './' }));

app.onError(errorHandler);

// Health & Info Endpoint
app.get('/', async (c) => {
  const dbConnected = await checkDatabase();
  return c.json({
    name: 'E-commerce Hono API',
    status: 'running',
    database: dbConnected ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString(),
  });
});

// Register Domain Modules
app.route('/api/auth', authModule);
app.route('/api/users', usersModule);
app.route('/api/products', productsModule);
app.route('/api/categories', categoriesModule);
app.route('/api/designers', designersModule);
app.route('/api/collections', collectionsModule);
app.route('/api/checkout', checkoutModule);
app.route('/api/orders', ordersModule);
app.route('/api/payments', paymentsModule);
app.route('/api/shipping', shippingModule);
app.route('/api/reviews', reviewsModule);
app.route('/api/wishlist', wishlistModule);
app.route('/api/media', mediaModule);
app.route('/api/appointments', appointmentsModule);
app.route('/api/admin', adminModule);

console.log(`🚀 Hono backend running on http://localhost:${env.port}`);

serve({
  fetch: app.fetch,
  port: env.port,
});
