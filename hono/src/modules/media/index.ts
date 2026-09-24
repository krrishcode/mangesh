import { Hono } from 'hono';
import fs from 'fs';
import path from 'path';

export const mediaModule = new Hono();

// Ensure uploads directory exists
const uploadsDir = path.resolve(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

mediaModule.get('/', (c) => c.json({ success: true, module: 'media' }));

// POST /api/media/upload
// Supports multipart/form-data with one or multiple files ('files' or 'file')
mediaModule.post('/upload', async (c) => {
  try {
    const body = await c.req.parseBody({ all: true });
    
    // Extract files from form
    let rawFiles: any = body['files'] || body['file'] || body['images'] || body['image'];
    if (!rawFiles) {
      // Check if any property has a File
      for (const key of Object.keys(body)) {
        if (body[key] instanceof File || (Array.isArray(body[key]) && body[key][0] instanceof File)) {
          rawFiles = body[key];
          break;
        }
      }
    }

    if (!rawFiles) {
      return c.json({ success: false, error: 'No files provided' }, 400);
    }

    const fileList: File[] = Array.isArray(rawFiles) ? rawFiles : [rawFiles];
    const uploadedUrls: string[] = [];

    for (const file of fileList) {
      if (!(file instanceof File)) continue;
      
      const ext = path.extname(file.name) || '.jpg';
      const cleanBase = path.basename(file.name, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
      const uniqueFilename = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}_${cleanBase}${ext}`;
      const filePath = path.join(uploadsDir, uniqueFilename);

      const buffer = Buffer.from(await file.arrayBuffer());
      await fs.promises.writeFile(filePath, buffer);

      // Return absolute or relative URL
      uploadedUrls.push(`http://localhost:4000/uploads/${uniqueFilename}`);
    }

    return c.json({
      success: true,
      message: `Uploaded ${uploadedUrls.length} image(s)`,
      urls: uploadedUrls,
      url: uploadedUrls[0] || null,
    });
  } catch (error: any) {
    console.error('Media upload error:', error);
    return c.json({ success: false, error: error.message || 'Upload failed' }, 500);
  }
});
