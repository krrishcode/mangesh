import type { Pool } from 'pg';
import { managedObjectKey, objectUrl, storageClient } from './object-storage';

export async function processMediaCleanup(pool: Pool, remove = async (key: string) => {
  const response = await storageClient().fetch(objectUrl(key), { method: 'DELETE' });
  if (!response.ok && response.status !== 404) throw new Error('STORAGE_DELETE_FAILED');
  if (process.env.CLOUDFLARE_CACHE_TOKEN && process.env.CLOUDFLARE_ZONE_ID) {
    const purge = await fetch(`https://api.cloudflare.com/client/v4/zones/${process.env.CLOUDFLARE_ZONE_ID}/purge_cache`, {
      method: 'POST', headers: { Authorization: `Bearer ${process.env.CLOUDFLARE_CACHE_TOKEN}`, 'Content-Type':'application/json' },
      body: JSON.stringify({files:[`${process.env.R2_PUBLIC_URL!.replace(/\/$/,'')}/${key}`]}),
    });
    if (!purge.ok || !(await purge.json()).success) throw new Error('CDN_PURGE_FAILED');
  }
}) {
  // Includes abandoned uploads. The upload URL expires after five minutes.
  await pool.query(`INSERT INTO media_cleanup_jobs(url)
    SELECT url FROM media_assets WHERE protected=false AND state<>'deleted' AND created_at<now()-interval '24 hours'
    ON CONFLICT(url) DO NOTHING`);
  const jobs = await pool.query<{url:string}>('SELECT url FROM media_cleanup_jobs WHERE next_attempt_at<=now() ORDER BY next_attempt_at LIMIT 10');
  const outcomes: Array<{url:string;status:string}> = [];
  for (const job of jobs.rows) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query('SELECT pg_advisory_xact_lock(hashtextextended($1,741029))', [job.url]);
      const {rows:[current]} = await client.query('SELECT attempts FROM media_cleanup_jobs WHERE url=$1 AND next_attempt_at<=now() FOR UPDATE', [job.url]);
      if (!current) { await client.query('COMMIT'); continue; }
      const {rows:[asset]} = await client.query('SELECT object_key,protected,state FROM media_assets WHERE url=$1', [job.url]);
      const key = managedObjectKey(job.url);
      const {rows:[usage]} = await client.query(`SELECT EXISTS(SELECT 1 FROM products p WHERE strpos(to_jsonb(p)::text,$1)>0)
        OR EXISTS(SELECT 1 FROM order_item_variants WHERE image_url=$1) AS referenced`, [job.url]);
      if (asset && key && key === asset.object_key && !asset.protected && !usage.referenced && asset.state !== 'deleted') {
        await remove(key);
        await client.query("UPDATE media_assets SET state='deleted',deleted_at=now() WHERE url=$1", [job.url]);
        outcomes.push({url:job.url,status:'deleted'});
      } else outcomes.push({url:job.url,status:'retained'});
      await client.query('DELETE FROM media_cleanup_jobs WHERE url=$1', [job.url]);
      await client.query('COMMIT');
    } catch {
      await client.query('ROLLBACK');
      // Retries remain durable across worker restarts and temporary R2 outages.
      await pool.query(`UPDATE media_cleanup_jobs SET attempts=attempts+1,last_error='STORAGE_CLEANUP_FAILED',
        next_attempt_at=now()+(least(3600,30*power(2,least(attempts,7))) * interval '1 second') WHERE url=$1`, [job.url]);
      outcomes.push({url:job.url,status:'retry'});
    } finally { client.release(); }
  }
  return outcomes;
}
