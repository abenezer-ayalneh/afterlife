import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {createServer} from 'node:net';
import {request as httpRequest} from 'node:http';
import {openDatabase,migrate} from '../src/lib/sqlite-core.mjs';
import {passwordHash} from '../src/lib/passwords.mjs';
import {createHmac,randomBytes} from 'node:crypto';
import {bookChapters} from './chapters.mjs';
const directory=await mkdtemp(join(tmpdir(),'afterlife-smoke-'));
const probe=createServer();probe.listen(0,'127.0.0.1');await once(probe,'listening');const port=probe.address().port;await new Promise(resolve=>probe.close(resolve));
const origin='https://afterlife.abenezer-ayalneh.dev';
const emails=['abenezer.ayalneh.42@gmail.com','boersarama@gmail.com'];
const password='smoke test password only';
const salt='x'.repeat(32);
const filename=join(directory,'staging.sqlite');const db=openDatabase(filename);migrate(db);
for(const email of emails)await db.prepare('INSERT INTO admin_accounts(email,password_hash) VALUES(?,?)').bind(email,await passwordHash(password)).run();
db.close();
const child=spawn(process.execPath,['scripts/start.mjs'],{cwd:resolve('.'),env:{...process.env,APP_ENV:'staging',PUBLIC_ORIGIN:origin,DATABASE_PATH:filename,ADMIN_EMAILS:emails.join(','),RATE_LIMIT_SALT:salt,HOST:'127.0.0.1',PORT:String(port)},stdio:['ignore','pipe','pipe']});
let logs='';child.stdout.on('data',data=>logs+=data);child.stderr.on('data',data=>logs+=data);
const headers={Host:new URL(origin).host,'X-Forwarded-Host':new URL(origin).host,'X-Forwarded-Proto':'https','X-Forwarded-Port':'443','X-Real-IP':'192.0.2.42'};
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
 assert.equal((await request('/admin')).status,303);assert.equal((await request('/admin/api/export/ratings')).status,401);
 for(const patch of [{Host:'evil.test'},{'X-Forwarded-Host':'evil.test'},{'X-Forwarded-Proto':'http'},{'X-Forwarded-Port':'4321'},{Forwarded:'host=evil.test'}])assert.equal((await request('/',{headers:patch})).status,403);
 const options={method:'POST',headers:{'Content-Type':'application/json',Accept:'application/json',Origin:origin,Cookie:cookie.split(';')[0]}};
 const chapterHTML=await (await request('/chapters/1',{headers:{Cookie:cookie.split(';')[0]}})).text();
 const tokens=[...chapterHTML.matchAll(/name="formToken" value="([^"]+)"/g)].map(match=>match[1]);assert.ok(tokens.length>=2);
 const owner=JSON.parse(Buffer.from(tokens[0].split('.')[0],'base64url').toString()).owner;
 // Use rendered tokens for initial public forms, signed fixtures for subsequent mutation actions.
 const protection=action=>{
  const payload=Buffer.from(JSON.stringify({owner,action,issued:Date.now()-2000,nonce:randomBytes(16).toString('hex')})).toString('base64url');
  return {contact_url:'',formToken:payload+'.'+createHmac('sha256',salt).update('form:'+payload).digest('hex')};
 };
 await new Promise(resolve=>setTimeout(resolve,1100));
 const submit=body=>request('/api/chapters/1/rating',{...options,body:JSON.stringify(body)});
 assert.equal((await submit({score:0,version:0,requestId:crypto.randomUUID()})).status,400);
 const saved=await submit({score:0,version:0,requestId:crypto.randomUUID(),contact_url:'',formToken:tokens[0]});assert.equal(saved.status,200,await saved.clone().text());assert.equal((await saved.json()).rating.score,0);
 const updated=await submit({score:10,version:1,requestId:crypto.randomUUID(),...protection('rating')});assert.equal(updated.status,200);assert.equal((await updated.json()).results.count,1);
 const results=await request('/api/chapters/1/results',{headers:{Cookie:cookie.split(';')[0]}});assert.equal((await results.json()).rating.score,10);
 const commentId=crypto.randomUUID();
 const post=await request('/api/chapters/1/comments',{...options,body:JSON.stringify({requestId:commentId,author:'Reader',body:'ሰላም 📖',contact_url:'',formToken:tokens[1]})});assert.equal(post.status,201,await post.clone().text());
 const edit=await request(`/api/comments/${commentId}/edit`,{...options,body:JSON.stringify({version:1,author:'Reader',body:'Edited 📖',...protection('edit')})});assert.equal(edit.status,200,await edit.clone().text());
 const listed=await request('/api/chapters/1/comments',{headers:{Cookie:cookie.split(';')[0]}});const items=(await listed.json()).items;assert.equal(items[0].body,'Edited 📖');assert.equal(items[0].owned,true);
 const remove=await request(`/api/comments/${commentId}/delete`,{...options,body:JSON.stringify(protection('delete'))});assert.equal(remove.status,200);
 for(const email of emails){
  const loginHTML=await (await request('/admin/login',{headers:{Cookie:cookie.split(';')[0]}})).text();
  const token=loginHTML.match(/name="formToken" value="([^"]+)"/);assert.ok(token);
  const login=await request('/admin/login',{...options,body:JSON.stringify({email,password,contact_url:'',formToken:token[1]})});assert.equal(login.status,303,await login.clone().text());
  const adminCookie=login.headers.get('set-cookie');assert.match(adminCookie,/__Host-admin=/);assert.match(adminCookie,/Secure/);assert.match(adminCookie,/SameSite=Strict/i);
  const authenticated=cookie.split(';')[0]+'; '+adminCookie.split(';')[0];
  const admin=await request('/admin',{headers:{Cookie:authenticated}});assert.equal(admin.status,200);const adminHTML=await admin.text();assert.ok(adminHTML.includes(email));
  const csv=await request('/admin/api/export/ratings',{headers:{Cookie:authenticated}});assert.equal(csv.status,200);assert.ok(!(await csv.text()).includes('password_hash'));
  const rename=await request('/admin/api/rename',{...options,headers:{...options.headers,Cookie:authenticated},body:JSON.stringify({chapter:1,title:'Religion',...protection('admin:rename')})});assert.equal(rename.status,303,await rename.clone().text());
  const logoutToken=adminHTML.match(/name="formToken" value="([^"]+)"/);assert.ok(logoutToken);
  const logout=await request('/admin/logout',{...options,headers:{...options.headers,Cookie:authenticated},body:JSON.stringify({contact_url:'',formToken:logoutToken[1]})});assert.equal(logout.status,303);
  assert.equal((await request('/admin/api/export/ratings',{headers:{Cookie:authenticated}})).status,401);
 }
 const persisted=openDatabase(filename);assert.equal(persisted.connection.prepare('SELECT score FROM ratings WHERE chapter_id=1').get().score,10);persisted.close();
 console.log(`Node smoke verified: ${bookChapters.length} chapters, HTTPS proxy headers, cookies, assets, both local administrator logins/logout/exports, signed forms and persistent ratings and comment create/edit/delete.`);
} finally {
 if(child.exitCode===null){const ended=once(child,'exit');child.kill('SIGTERM');await ended;}
 await rm(directory,{recursive:true,force:true});
}
