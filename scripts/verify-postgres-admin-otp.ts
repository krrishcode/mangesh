import assert from 'node:assert/strict';
import {randomBytes} from 'node:crypto';
import dotenv from 'dotenv';
import pg from 'pg';
dotenv.config({path:'.env.postgres.local',quiet:true});
Object.assign(process.env,{POSTGRES_SCHEMA:'mangesh_qa',JWT_SECRET:randomBytes(32).toString('hex'),APP_ORIGIN:'http://localhost:3002',COD_ENABLED:'true',AUTH_OTP_DEV_BYPASS:'true',NODE_ENV:'test',SMTP_HOST:'',SMTP_FROM:'',GOOGLE_CLIENT_ID:''});
const pool=new pg.Pool({connectionString:process.env.POSTGRES_URL,ssl:{rejectUnauthorized:true},options:'-c search_path=mangesh_qa'});
assert.equal((await pool.query('SELECT current_schema() AS schema')).rows[0].schema, 'mangesh_qa');
const {hashPassword}=await import('../src/server/lib/password');
const {handleApi}=await import('../src/server/http/router');
const {connectionPool}=await import('../src/server/db');
const suffix=Date.now().toString();
const email=`qa-admin-${suffix}@example.invalid`, pass='Secure-QA-Only-123!';
await pool.query("INSERT INTO users (email,password_hash,name,role) VALUES ($1,$2,'QA Admin','admin')",[email,await hashPassword(pass)]);
function client(){const cookies=new Map<string,string>();return {token:'',async request(path:string,method='GET',body?:unknown){const response=await handleApi(new Request(`http://localhost:3002/api/account${path}`,{method,headers:{'Content-Type':'application/json',Origin:'http://localhost:3002','x-forwarded-for':'127.0.0.101',...(this.token?{Authorization:`Bearer ${this.token}`} : {}),...(cookies.size?{Cookie:[...cookies].map(([k,v])=>`${k}=${v}`).join('; ')}:{})},...(body===undefined?{}:{body:JSON.stringify(body)})}),path.slice(1).split('/'));for(const value of response.headers.getSetCookie()){const [k,v]=value.split(';')[0].split('=');cookies.set(k,v)};return {status:response.status,data:await response.json()};}}}
const admin=client(),customer=client();
const expect=(r:any,status=200)=>{assert.equal(r.status,status,JSON.stringify(r.data));return r.data.data};
const results:string[]=[];
async function check(name:string,run:()=>Promise<void>){await run();results.push(name);console.log('PASS',name)}
try {
 await check('admin login',async()=>{const r=expect(await admin.request('/auth/login','POST',{email,password:pass}));admin.token=r.token;assert.equal(r.user.role,'admin')});
 await check('all admin module reads',async()=>{for(const p of ['overview','dashboard','products','categories','orders','payments','customers','appointments','reviews','settings'])expect(await admin.request('/admin/'+p))});
 let categoryId=0,productId=0,customerId=0;
 await check('admin category create and duplicate conflict',async()=>{const body={name:'QA Category',slug:`qa-${suffix}`}; categoryId=expect(await admin.request('/admin/categories','POST',body),201).id; assert.equal((await admin.request('/admin/categories','POST',body)).status,409)});
 await check('admin product create and update',async()=>{const body={title:'QA Product',slug:`qa-product-${suffix}`,sku:`QA-${suffix}`,price:'100.00',stock:2,categoryId};productId=expect(await admin.request('/admin/products','POST',body),201).id;expect(await admin.request(`/admin/products/${productId}`,'PUT',{title:'QA Updated'}))});
 await check('admin settings upsert',async()=>{expect(await admin.request('/admin/settings','PUT',{key:'store_name',value:'QA Store'}));expect(await admin.request('/admin/settings','PUT',{key:'store_name',value:'QA Updated Store'}))});
 await check('OTP signup and account session',async()=>{const otp=expect(await customer.request('/auth/otp/request','POST',{email:`otp-${suffix}@example.invalid`,termsAccepted:true}));const result=expect(await customer.request('/auth/otp/verify','POST',{challengeId:otp.challengeId,code:'123456',firstName:'QA',lastName:'User',newsletterOptIn:false}));customerId=result.user.id;customer.token=result.token;assert.equal(expect(await customer.request('/auth/me')).user.id,customerId)});
 await check('admin appointment create and cancel',async()=>{const v=expect(await admin.request('/admin/appointments','POST',{customerId,location:'QA Store',occasion:'Fitting',scheduledAt:new Date(Date.now()+86400000).toISOString()}),201);expect(await admin.request(`/admin/appointments/${v.id}/status`,'PATCH',{status:'cancelled'}))});
 console.log(`RESULT ${results.length}/${results.length} passed`);
} finally {await pool.end();await connectionPool.end()}
