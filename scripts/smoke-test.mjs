// Local verification only: mock outbound Turnstile verification in a child process.
// This script and fixture are not used by PM2 or included in the maintenance image.
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {createServer} from 'node:net';
import {request as httpRequest} from 'node:http';
import {openDatabase,migrate} from '../src/lib/sqlite-core.mjs';
import {bookChapters} from './chapters.mjs';
const directory=await mkdtemp(join(tmpdir(),'afterlife-smoke-'));
const probe=createServer();probe.listen(0,'127.0.0.1');await once(probe,'listening');const port=probe.address().port;await new Promise(resolve=>probe.close(resolve));
const origin='https://afterlife.abenezer-ayalneh.dev';
const filename=join(directory,'staging.sqlite');const db=openDatabase(filename);migrate(db);db.close();
const fixture=join(directory,'turnstile-fixture.mjs');
await writeFile(fixture,`const original=globalThis.fetch;globalThis.fetch=(url,options)=>String(url)==='https://challenges.cloudflare.com/turnstile/v0/siteverify'?Promise.resolve(Response.json({success:JSON.parse(options.body).response.startsWith('test-'),hostname:'afterlife.abenezer-ayalneh.dev',action:JSON.parse(options.body).response==='test-token'?'rating':JSON.parse(options.body).response.slice(5)})):original(url,options);`);
const child=spawn(process.execPath,['--import',fixture,'scripts/start.mjs'],{cwd:resolve('.'),env:{...process.env,APP_ENV:'staging',PUBLIC_ORIGIN:origin,DATABASE_PATH:filename,ADMIN_EMAILS:'abenezer.ayalneh.42@gmail.com,boersarama@gmail.com',ACCESS_TEAM_DOMAIN:'example.cloudflareaccess.com',ACCESS_AUD:'test-audience',TURNSTILE_SITE_KEY:'test-site',TURNSTILE_SECRET_KEY:'test-secret',RATE_LIMIT_SALT:'x'.repeat(32),HOST:'127.0.0.1',PORT:String(port)},stdio:['ignore','pipe','pipe']});
let logs='';child.stdout.on('data',data=>logs+=data);child.stderr.on('data',data=>logs+=data);
const headers={Host:new URL(origin).host,'X-Forwarded-Host':new URL(origin).host,'X-Forwarded-Proto':'https','X-Forwarded-Port':'443'};
const request=(path,options={})=>new Promise((resolve,reject)=>{
 const req=httpRequest({hostname:'127.0.0.1',port,path,method:options.method||'GET',headers:{...headers,...options.headers},signal:AbortSignal.timeout(5000)},response=>{
  const chunks=[];response.on('data',chunk=>chunks.push(chunk));response.on('end',()=>resolve(new Response(Buffer.concat(chunks),{status:response.statusCode,headers:response.headers})));
 });req.on('error',reject);req.end(options.body);
});
try {
 let ready=false;let captured=false;
 for(let i=0;i<100;i++){if(child.exitCode!==null)throw new Error(logs);try{const response=await request('/health');if(response.ok){ready=true;break}if(!captured){captured=true;logs+=` HEALTH ${response.status}: ${await response.text()}`}}catch(error){if(i===99)logs+=String(error)}await new Promise(resolve=>setTimeout(resolve,50));}
 assert.ok(ready,logs);
 const home=await request('/');assert.equal(home.status,200);const html=await home.text();assert.ok(html.includes('An Afterlife'));
 const cookie=home.headers.get('set-cookie');assert.match(cookie,/__Host-reader=/);assert.match(cookie,/Secure/);assert.match(cookie,/HttpOnly/);
 for(const item of bookChapters)assert.equal((await request(`/chapters/${item.id}`)).status,200);
 assert.equal((await request('/privacy')).status,200);assert.equal((await request('/guidelines')).status,200);
 const asset=html.match(/(?:src|href)="([^\"]+\.css)"/);assert.ok(asset);assert.equal((await request(asset[1])).status,200);
 assert.equal((await request('/admin')).status,401);assert.equal((await request('/admin/api/export/ratings')).status,401);
 for(const patch of [{Host:'evil.test'},{'X-Forwarded-Host':'evil.test'},{'X-Forwarded-Proto':'http'},{'X-Forwarded-Port':'4321'},{Forwarded:'host=evil.test'}])assert.equal((await request('/',{headers:patch})).status,403);
 const options={method:'POST',headers:{'Content-Type':'application/json',Accept:'application/json',Origin:origin,Cookie:cookie.split(';')[0],'CF-Connecting-IP':'192.0.2.42'}};
 const submit=body=>request('/api/chapters/1/rating',{...options,body:JSON.stringify(body)});
 assert.equal((await submit({score:0,version:0,requestId:crypto.randomUUID()})).status,400);
 const saved=await submit({score:0,version:0,requestId:crypto.randomUUID(),'cf-turnstile-response':'test-token'});assert.equal(saved.status,200,await saved.clone().text());assert.equal((await saved.json()).rating.score,0);
 const updated=await submit({score:10,version:1,requestId:crypto.randomUUID(),'cf-turnstile-response':'test-token'});assert.equal(updated.status,200);assert.equal((await updated.json()).results.count,1);
 const results=await request('/api/chapters/1/results',{headers:{Cookie:cookie.split(';')[0]}});assert.equal((await results.json()).rating.score,10);
 const commentId=crypto.randomUUID();
 const post=await request('/api/chapters/1/comments',{...options,body:JSON.stringify({requestId:commentId,author:'Reader',body:'ሰላም 📖','cf-turnstile-response':'test-comment'})});assert.equal(post.status,201,await post.clone().text());
 const edit=await request(`/api/comments/${commentId}/edit`,{...options,body:JSON.stringify({version:1,author:'Reader',body:'Edited 📖','cf-turnstile-response':'test-edit'})});assert.equal(edit.status,200);
 const listed=await request('/api/chapters/1/comments',{headers:{Cookie:cookie.split(';')[0]}});const items=(await listed.json()).items;assert.equal(items[0].body,'Edited 📖');assert.equal(items[0].owned,true);
 const remove=await request(`/api/comments/${commentId}/delete`,{...options,body:JSON.stringify({'cf-turnstile-response':'test-delete'})});assert.equal(remove.status,200);
 const persisted=openDatabase(filename);assert.equal(persisted.connection.prepare('SELECT score FROM ratings WHERE chapter_id=1').get().score,10);persisted.close();
 console.log(`Node smoke verified: ${bookChapters.length} chapters, HTTPS proxy headers, cookies, assets, admin denial, Turnstile failure and persistent ratings and comment create/edit/delete.`);
} finally {
 if(child.exitCode===null){const ended=once(child,'exit');child.kill('SIGTERM');await ended;}
 await rm(directory,{recursive:true,force:true});
}
