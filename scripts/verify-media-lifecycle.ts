import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { config } from 'dotenv';
import pg from 'pg';
import { processMediaCleanup } from '../src/server/lib/media-cleanup';
import { objectUrl, publicObjectUrl, signedImageUpload, storageClient } from '../src/server/lib/object-storage';
config({path:'.env.local',quiet:true});
config({path:'.env.r2.local',quiet:true});
if (!process.argv.includes('--allow-qa')) throw new Error('Pass --allow-qa to test only the isolated mangesh_qa schema');
const pool=new pg.Pool({connectionString:process.env.POSTGRES_URL,max:3,ssl:{rejectUnauthorized:true},options:'-c search_path=mangesh_qa'});
const client=storageClient();
const tag='media-qa-'+randomUUID();
const assets:string[]=[];const ids:number[]=[];let passed=0;
const bytes=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aN1sAAAAASUVORK5CYII=','base64');
async function asset(protectedAsset=false,age=false) {
  const key=`products/${tag}-${assets.length}.png`;assets.push(key);
  const url=publicObjectUrl(key);
  const signed=await signedImageUpload(key,'image/png',bytes.length);
  const result=await fetch(signed,{method:'PUT',headers:{'Content-Type':'image/png','Cache-Control':'public, max-age=86400'},body:bytes});
  assert.equal(result.status,200,'Signed browser-style PUT must succeed');passed++;
  await pool.query(`INSERT INTO media_assets(object_key,url,content_type,byte_size,state,protected,created_at)
    VALUES($1,$2,'image/png',$3,'ready',$4,now()-($5 * interval '1 hour'))`,[key,url,bytes.length,protectedAsset,age?25:0]);
  return {key,url};
}
async function product(url:string) {
  const sku=tag+'-'+ids.length;
  const {rows:[row]}=await pool.query('INSERT INTO products(title,slug,sku,price,stock,image_front,gallery) VALUES($1,$1,$1,100,1,$2,$3) RETURNING id',[sku,url,JSON.stringify([url])]);
  ids.push(row.id);return row.id as number;
}
async function drain() {
  await pool.query('UPDATE media_cleanup_jobs SET next_attempt_at=now() WHERE url LIKE $1',['%'+tag+'%']);
  return processMediaCleanup(pool);
}
try {
  assert.equal((await pool.query('SELECT current_schema() AS name')).rows[0].name,'mangesh_qa');
  const shared=await asset();const first=await product(shared.url);const second=await product(shared.url);
  const cdn=await fetch(shared.url);assert.equal(cdn.status,200);passed++;
  await pool.query('DELETE FROM products WHERE id=$1',[first]);await drain();
  assert.equal((await client.fetch(objectUrl(shared.key),{method:'HEAD'})).status,200,'Shared images must remain');passed++;
  await pool.query('DELETE FROM products WHERE id=$1',[second]);await drain();
  assert.equal((await client.fetch(objectUrl(shared.key),{method:'HEAD'})).status,404,'Last reference removal must delete R2 object');passed++;
  assert.equal((await fetch(shared.url)).status,404,'Deleted images must also leave the CDN cache');passed++;
  await assert.rejects(()=>product(shared.url),/unavailable|incomplete/);passed++;

  const keep=await asset(true);const keepId=await product(keep.url);
  await pool.query('DELETE FROM products WHERE id=$1',[keepId]);await drain();
  assert.equal((await client.fetch(objectUrl(keep.key),{method:'HEAD'})).status,200,'Protected site images must remain');passed++;

  const old=await asset();const replacement=await asset();const edited=await product(old.url);
  await pool.query('UPDATE products SET image_front=$1,gallery=$2 WHERE id=$3',[replacement.url,JSON.stringify([replacement.url]),edited]);await drain();
  assert.equal((await client.fetch(objectUrl(old.key),{method:'HEAD'})).status,404,'Removed gallery images must be cleaned');passed++;
  assert.equal((await client.fetch(objectUrl(replacement.key),{method:'HEAD'})).status,200);passed++;

  const tx=await pool.connect();
  try {await tx.query('BEGIN');await tx.query('DELETE FROM products WHERE id=$1',[edited]);await tx.query('ROLLBACK');}finally{tx.release();}
  assert.equal((await pool.query('SELECT count(*)::int AS n FROM media_cleanup_jobs WHERE url=$1',[replacement.url])).rows[0].n,0,'Rollback must not create cleanup jobs');passed++;
  await pool.query('DELETE FROM products WHERE id=$1',[edited]);
  await pool.query('UPDATE media_cleanup_jobs SET next_attempt_at=now() WHERE url=$1',[replacement.url]);
  await processMediaCleanup(pool,async()=>{throw new Error('Temporary outage');});
  assert.equal((await pool.query('SELECT attempts FROM media_cleanup_jobs WHERE url=$1',[replacement.url])).rows[0].attempts,1,'Failures must remain queued');passed++;
  await drain();assert.equal((await client.fetch(objectUrl(replacement.key),{method:'HEAD'})).status,404);passed++;

  const abandoned=await asset(false,true);await drain();
  assert.equal((await client.fetch(objectUrl(abandoned.key),{method:'HEAD'})).status,404,'Abandoned uploads must be collected');passed++;
  console.log(JSON.stringify({schema:'mangesh_qa',passed,sharedImageProtection:true,cdnPurge:true,replacementCleanup:true,rollbackSafe:true,durableRetry:true,orphanCleanup:true}));
} finally {
  await pool.query('DELETE FROM products WHERE sku LIKE $1',[tag+'%']);
  for(const key of assets)await client.fetch(objectUrl(key),{method:'DELETE'});
  await pool.query('DELETE FROM media_cleanup_jobs WHERE url LIKE $1',['%'+tag+'%']);
  await pool.query('DELETE FROM media_assets WHERE object_key LIKE $1',['%'+tag+'%']);
  await pool.end();
}
