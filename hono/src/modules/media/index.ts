import { Hono } from 'hono';
import { bodyLimit } from 'hono/body-limit';
import { randomUUID } from 'crypto';
import { promises as fs } from 'fs';
import path from 'path';
import { db } from '../../db/index.js';
import { media } from '../../db/schema/index.js';
import { requireAuth } from '../../middleware/auth.js';
import { requireAdmin } from '../../middleware/admin.js';

export const mediaModule = new Hono();
mediaModule.use('*', requireAuth, requireAdmin);
mediaModule.use('/upload', bodyLimit({ maxSize: 32 * 1024 * 1024, onError: (c) => c.json({ success: false, error: 'Upload is too large. Maximum request size is 32 MB.' }, 413) }));
mediaModule.get('/', async (c) => c.json({ success: true, data: await db.select().from(media) }));

export function imageExtension(bytes: Buffer): string | null {
  if (bytes.length < 12) return null;
  if (bytes.subarray(0, 3).equals(Buffer.from([255, 216, 255]))) return '.jpg';
  if (bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) return '.png';
  if (bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP') return '.webp';
  return null;
}
mediaModule.post('/upload', async (c) => {
  const body = await c.req.parseBody({ all: true });
  const files = Object.values(body).flat().filter((value): value is File => value instanceof File);
  if (!files.length || files.length > 6) return c.json({ success: false, error: 'Choose between 1 and 6 JPG, PNG or WebP images.' }, 400);
  const validated: Array<{ bytes: Buffer; filename: string }> = [];
  for (const file of files) {
    if (!file.size || file.size > 8 * 1024 * 1024) return c.json({ success: false, error: 'Each image must be smaller than 8 MB.' }, 400);
    const bytes = Buffer.from(await file.arrayBuffer());
    const ext = imageExtension(bytes);
    if (!ext) return c.json({ success: false, error: 'Only JPG, PNG and WebP images are supported.' }, 400);
    validated.push({ bytes, filename: randomUUID() + ext });
  }
  const directory = path.resolve(process.cwd(), 'uploads');
  await fs.mkdir(directory, { recursive: true });
  const written: string[] = [];
  try {
    for (const file of validated) { await fs.writeFile(path.join(directory, file.filename), file.bytes, { flag: 'wx' }); written.push(file.filename); }
  } catch (error) { await Promise.all(written.map(name => fs.unlink(path.join(directory, name)).catch(() => {}))); throw error; }
  const origin = process.env.PUBLIC_API_ORIGIN || new URL(c.req.url).origin;
  const urls = written.map(name => new URL('/uploads/' + name, origin).toString());
  return c.json({ success: true, urls, url: urls[0] }, 201);
});
