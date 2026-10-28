import { beforeEach, describe, expect, it, vi } from 'vitest';
const mocks=vi.hoisted(()=>({query:vi.fn(),authorize:vi.fn(),fetch:vi.fn(),sign:vi.fn()}));
vi.mock('../db',()=>({connectionPool:{query:mocks.query}}));
vi.mock('../lib/upload',async()=>{
  const {AppError}=await import('../lib/errors');
  return {authorizeUpload:mocks.authorize,storageConfigured:()=>true,validateUploadPath:(key:string)=>{if(!/^products\/[\w-]+\.(png|jpg|webp)$/.test(key))throw new AppError(400,'Invalid upload path.');}};
});
vi.mock('../lib/object-storage',async importOriginal=>({
  ...await importOriginal<typeof import('../lib/object-storage')>(),
  publicObjectUrl:(key:string)=>'https://cdn.mangeshmahadev.com/'+key,
  signedImageUpload:mocks.sign,
  storageClient:()=>({fetch:mocks.fetch}),
}));
import { POST } from '../../app/api/account/media/upload/route';
import { AppError } from '../lib/errors';
const request=(body:unknown,origin='http://localhost')=>POST(new Request('http://localhost/api/account/media/upload',{method:'POST',headers:{'Content-Type':'application/json',Origin:origin},body:JSON.stringify(body)}));
beforeEach(()=>{vi.resetAllMocks();mocks.authorize.mockResolvedValue({});mocks.query.mockResolvedValue({rows:[]});mocks.sign.mockResolvedValue('https://fixture.r2.cloudflarestorage.com/signed');});
describe('admin R2 upload route',()=>{
  it('rejects cross-site requests before issuing a signed URL',async()=>{
    expect((await request({action:'prepare',size:128,contentType:'image/png'},'https://evil.example')).status).toBe(403);
    expect(mocks.sign).not.toHaveBeenCalled();
  });
  it('rejects non-admin users',async()=>{
    mocks.authorize.mockRejectedValue(new AppError(403,'Forbidden'));
    expect((await request({action:'prepare',size:128,contentType:'image/png'})).status).toBe(403);
    expect(mocks.query).not.toHaveBeenCalled();
  });
  it.each([{size:0,contentType:'image/png'},{size:9*1024*1024,contentType:'image/png'},{size:128,contentType:'image/svg+xml'}])('rejects invalid uploads %j',async body=>{
    expect((await request({action:'prepare',...body})).status).toBe(400);expect(mocks.sign).not.toHaveBeenCalled();
  });
  it('registers a pending object before issuing the upload URL',async()=>{
    const response=await request({action:'prepare',size:128,contentType:'image/png'});
    expect(response.status).toBe(200);
    expect(mocks.query.mock.calls[0][0]).toContain('INSERT INTO media_assets');
    expect((await response.json()).key).toMatch(/^products\/[a-f0-9-]+\.png$/);
  });
  it('rejects completion when the uploaded size is wrong',async()=>{
    mocks.query.mockResolvedValue({rows:[{content_type:'image/png',byte_size:128}]});
    mocks.fetch.mockResolvedValue(new Response(null,{headers:{'Content-Type':'image/png','Content-Length':'129'}}));
    expect((await request({action:'complete',key:'products/photo.png'})).status).toBe(400);
    expect(mocks.query).toHaveBeenCalledTimes(1);
  });
  it('rejects a disguised non-image',async()=>{
    mocks.query.mockResolvedValue({rows:[{content_type:'image/png',byte_size:128}]});
    mocks.fetch.mockResolvedValueOnce(new Response(null,{headers:{'Content-Type':'image/png','Content-Length':'128'}})).mockResolvedValueOnce(new Response('<svg>fake</svg>'));
    expect((await request({action:'complete',key:'products/photo.png'})).status).toBe(400);
    expect(mocks.query).toHaveBeenCalledTimes(1);
  });
  it('finalizes a genuine uploaded image',async()=>{
    const url='https://cdn.mangeshmahadev.com/products/photo.png';
    mocks.query.mockResolvedValue({rows:[{content_type:'image/png',byte_size:128,url}]});
    mocks.fetch.mockResolvedValueOnce(new Response(null,{headers:{'Content-Type':'image/png','Content-Length':'128'}})).mockResolvedValueOnce(new Response(new Uint8Array([137,80,78,71,13,10,26,10])));
    const response=await request({action:'complete',key:'products/photo.png'});
    expect(response.status).toBe(200);expect((await response.json()).url).toBe(url);
    expect(mocks.query.mock.calls[1][0]).toContain("state='ready'");
  });
});
