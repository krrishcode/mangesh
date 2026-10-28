#!/usr/bin/env node
// Converts raster images in public/ to WebP and rewrites their references in src/.
// Idempotent: a source is skipped once its .webp sibling exists and is newer.
import { readdirSync, statSync, rmSync, readFileSync, writeFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const PUBLIC_DIR = join(ROOT, 'public');
const SRC_DIR = join(ROOT, 'src');
const QUALITY = Number(process.env.WEBP_QUALITY || 90);
const EXTENSIONS = new Set(['.png', '.jpg', '.jpeg']);

function walk(dir, filter) {
  const found = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) found.push(...walk(full, filter));
    else if (filter(full)) found.push(full);
  }
  return found;
}

const sources = walk(PUBLIC_DIR, (f) => EXTENSIONS.has(f.slice(f.lastIndexOf('.')).toLowerCase()));
const rewritten = new Map();
let converted = 0;
let skipped = 0;
let bytesBefore = 0;
let bytesAfter = 0;

for (const file of sources) {
  const out = file.replace(/\.(png|jpe?g)$/i, '.webp');
  const stat = statSync(file);
  const alreadyDone = (() => {
    try {
      return statSync(out).mtimeMs >= stat.mtimeMs;
    } catch {
      return false;
    }
  })();

  if (alreadyDone) {
    skipped++;
    rewritten.set('/' + relative(PUBLIC_DIR, file).split(sep).join('/'), '/' + relative(PUBLIC_DIR, out).split(sep).join('/'));
    continue;
  }

  const info = await sharp(file, { failOn: 'none' })
    .webp({ quality: QUALITY, effort: 6 })
    .toFile(out);

  if (info.size >= stat.size) {
    rmSync(out);
    console.log(`  kept  ${relative(PUBLIC_DIR, file)} (WebP would not be smaller)`);
    continue;
  }

  bytesBefore += stat.size;
  bytesAfter += info.size;
  rmSync(file);
  converted++;
  rewritten.set(
    '/' + relative(PUBLIC_DIR, file).split(sep).join('/'),
    '/' + relative(PUBLIC_DIR, out).split(sep).join('/'),
  );
  console.log(
    `  ${relative(PUBLIC_DIR, file)}  ${(stat.size / 1024).toFixed(0)}KB -> ${(info.size / 1024).toFixed(0)}KB`,
  );
}

if (converted === 0 && skipped === 0) {
  console.log('No images to convert.');
}

if (rewritten.size > 0) {
  const codeFiles = walk(SRC_DIR, (f) => /\.(ts|tsx)$/.test(f));
  let filesTouched = 0;
  for (const file of codeFiles) {
    const before = readFileSync(file, 'utf8');
    let after = before;
    for (const [oldPath, newPath] of rewritten) {
      if (after.includes(oldPath)) after = after.split(oldPath).join(newPath);
    }
    if (after !== before) {
      writeFileSync(file, after);
      filesTouched++;
      console.log(`  updated references in ${relative(ROOT, file)}`);
    }
  }
  if (filesTouched === 0) console.log('  no source references needed updating');
}

console.log(
  `\nConverted ${converted}, already-current ${skipped}. ` +
    (bytesBefore ? `${(bytesBefore / 1048576).toFixed(1)}MB -> ${(bytesAfter / 1048576).toFixed(1)}MB` : 'No new bytes saved'),
);
