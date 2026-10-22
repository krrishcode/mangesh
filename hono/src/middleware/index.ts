import type { Context } from 'hono';
import { AppError } from '../lib/errors.js';

export async function errorHandler(err: Error, c: Context) {
  if (err instanceof AppError) return c.json({ success: false, error: err.message }, err.status);
  console.error('Unhandled Error:', err);
  return c.json(
    {
      success: false,
      error: 'The service is temporarily unavailable. Please try again.',
    },
    500
  );
}
