import type { Context } from 'hono';

export async function errorHandler(err: Error, c: Context) {
  console.error('Unhandled Error:', err);
  return c.json(
    {
      success: false,
      error: err.message || 'Internal Server Error',
    },
    500
  );
}
