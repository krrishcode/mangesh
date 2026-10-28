import { config } from 'dotenv';
import { setTimeout } from 'node:timers/promises';
import pg from 'pg';
import { processMediaCleanup } from '../src/server/lib/media-cleanup';
config({path:'.env.local',quiet:true});
config({path:'.env.r2.local',quiet:true});
if (!['POSTGRES_URL','R2_ACCOUNT_ID','R2_BUCKET','R2_ACCESS_KEY_ID','R2_SECRET_ACCESS_KEY','R2_PUBLIC_URL'].every(key=>process.env[key])) throw new Error('Configure PostgreSQL and R2 before starting media cleanup');
if (process.env.POSTGRES_SCHEMA && process.env.POSTGRES_SCHEMA !== 'mangesh_qa') throw new Error('Unsupported schema');
if (process.env.POSTGRES_SCHEMA === 'mangesh_qa' && !process.argv.includes('--allow-qa')) throw new Error('QA cleanup requires --allow-qa');
const pool = new pg.Pool({connectionString:process.env.POSTGRES_URL,max:2,ssl:{rejectUnauthorized:true},
  options:`-c search_path=${process.env.POSTGRES_SCHEMA || 'public'}`});
let stopping=false;
const controller=new AbortController();
for(const signal of ['SIGTERM','SIGINT'] as const) process.once(signal,()=>{stopping=true;controller.abort();});
try {
  await pool.query('SELECT 1 FROM media_assets LIMIT 1');
  console.log('Media worker ready: database and R2 configured.');
  do {
    try { for(const result of await processMediaCleanup(pool)) console.log(`Media cleanup: ${result.status}`); }
    catch { console.error('Media cleanup unavailable; retrying.'); }
    if(process.argv.includes('--once'))break;
    if(!stopping)await setTimeout(15000,undefined,{signal:controller.signal}).catch(()=>{});
  } while(!stopping);
} finally { await pool.end(); }
