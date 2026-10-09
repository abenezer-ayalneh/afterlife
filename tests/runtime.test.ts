import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,rm} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {validateConfig} from '../src/lib/config.mjs';
import {openDatabase,migrate} from '../src/lib/sqlite-core.mjs';
import {canonicalRequest,reader,rateLimit,type Runtime} from '../src/lib/security';
import type {APIContext} from 'astro';
const base={APP_ENV:'staging',PUBLIC_ORIGIN:'https://afterlife.abenezer-ayalneh.dev',DATABASE_PATH:'/var/lib/afterlife/staging.sqlite',ADMIN_EMAILS:'abenezer.ayalneh.42@gmail.com,boersarama@gmail.com',RATE_LIMIT_SALT:'x'.repeat(32)};
test('deployment configuration fails closed and isolates environments',()=>{
 assert.equal(validateConfig(base).ADMIN_EMAILS.length,2);
 for(const key of ['PUBLIC_ORIGIN','DATABASE_PATH','ADMIN_EMAILS','RATE_LIMIT_SALT'])assert.throws(()=>validateConfig({...base,[key]:''}));
 for(const patch of [{PUBLIC_ORIGIN:'http://afterlife.abenezer-ayalneh.dev'},{DATABASE_PATH:'relative.sqlite'},{DATABASE_PATH:'/var/lib/afterlife/production.sqlite'},{ADMIN_EMAILS:'other@example.com'},{APP_ENV:'production'},{PUBLIC_ORIGIN:base.PUBLIC_ORIGIN+'/'},{APP_ENV:'local'}])assert.throws(()=>validateConfig({...base,...patch}));
 assert.equal(validateConfig({APP_ENV:'local'},{allowLocal:true}).DATABASE_PATH,'.data/local.sqlite');
});
test('canonical HTTPS headers are accepted; hostile hosts and forwarded headers are rejected',()=>{
 const runtime={...validateConfig(base)} as unknown as Runtime;
 const request=(headers:Record<string,string>={})=>new Request(base.PUBLIC_ORIGIN+'/',{headers:{host:'afterlife.abenezer-ayalneh.dev','x-forwarded-host':'afterlife.abenezer-ayalneh.dev','x-forwarded-proto':'https','x-forwarded-port':'443',...headers}});
 canonicalRequest(request(),runtime);
 const hostile:Record<string,string>[]=[{host:'evil.test'},{'x-forwarded-host':'evil.test'},{'x-forwarded-proto':'http'},{'x-forwarded-port':'4321'},{forwarded:'host=evil.test'},{'x-forwarded-host':'afterlife.abenezer-ayalneh.dev,evil.test'}];
 for(const headers of hostile)assert.throws(()=>canonicalRequest(request(headers),runtime));
 assert.throws(()=>canonicalRequest(new Request('http://127.0.0.1:4321/'),runtime));
});
test('reader identity uses a secure first-party cookie on reconstructed HTTPS',async()=>{
 let saved:{name:string;options:Record<string,unknown>}|undefined;
 const context={request:new Request(base.PUBLIC_ORIGIN+'/'),cookies:{get:()=>undefined,set:(name:string,_value:string,options:Record<string,unknown>)=>{saved={name,options}}}} as unknown as APIContext;
 assert.match(await reader(context),/^[a-f\d]{64}$/);
 assert.equal(saved?.name,'__Host-reader');assert.equal(saved?.options.secure,true);assert.equal(saved?.options.httpOnly,true);assert.equal(saved?.options.sameSite,'lax');assert.equal(saved?.options.path,'/');
});
test('failed migrations roll back their SQL and ledger entry',async()=>{
 const directory=await mkdtemp(join(tmpdir(),'afterlife-migration-'));const db=openDatabase(join(directory,'test.sqlite'));
 try{
  await writeFile(join(directory,'0001_fail.sql'),'CREATE TABLE should_rollback(id INTEGER); INSERT INTO missing_table VALUES(1);');
  assert.throws(()=>migrate(db,directory));
  assert.equal(db.connection.prepare("SELECT name FROM sqlite_master WHERE name='should_rollback'").get(),undefined);
  assert.equal(db.connection.prepare('SELECT COUNT(*) AS count FROM schema_migrations').get()!.count,0);
 }finally{db.close();await rm(directory,{recursive:true,force:true});}
});
test('network limits use Nginx-normalized client addresses without storing raw IPs',async()=>{
 const db=openDatabase(':memory:');migrate(db);
 const runtime={...validateConfig(base),DB:db} as Runtime;
 try{
  const request=new Request(base.PUBLIC_ORIGIN+'/api',{headers:{'x-real-ip':'192.0.2.42'}});
  for(let i=0;i<60;i++)await rateLimit(request,runtime,`reader-${i}`);
  await assert.rejects(rateLimit(request,runtime,'another-reader'));
  const buckets=await db.prepare('SELECT bucket FROM rate_limits').all();assert.ok(!JSON.stringify(buckets).includes('192.0.2.42'));
 }finally{db.close();}
});
