import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {spawnSync} from 'node:child_process';
import type {APIContext} from 'astro';
import type {Database} from '../src/lib/sqlite';
import {openDatabase,migrate} from '../src/lib/sqlite-core.mjs';
import {passwordHash,passwordMatches} from '../src/lib/passwords.mjs';
import {administrator,signIn,signOut} from '../src/lib/auth';
import {formToken,hash,clientIP,type Runtime} from '../src/lib/security';

test('both local administrators sign in equally; sessions expire, logout and reset revoke access',async()=>{
 const directory=await mkdtemp(join(tmpdir(),'afterlife-auth-'));
 const filename=join(directory,'staging.sqlite');const db=openDatabase(filename);migrate(db);
 const ready=()=>spawnSync(process.execPath,['scripts/preflight.mjs','staging','--ready'],{env:{...process.env,APP_ENV:'staging',PUBLIC_ORIGIN:'https://afterlife.abenezer-ayalneh.dev',DATABASE_PATH:filename,ADMIN_EMAILS:'abenezer.ayalneh.42@gmail.com,boersarama@gmail.com',RATE_LIMIT_SALT:'x'.repeat(32)}});
 assert.notEqual(ready().status,0);
 const emails=['abenezer.ayalneh.42@gmail.com','boersarama@gmail.com'];
 const env:Runtime={DB:db as Database,APP_ENV:'staging',PUBLIC_ORIGIN:'https://book.test',ADMIN_EMAILS:emails,RATE_LIMIT_SALT:'x'.repeat(32)};
 const password='a long test password';const saved=await passwordHash(password);
 assert.ok(await passwordMatches(password,saved));assert.equal(await passwordMatches('wrong',saved),false);await assert.rejects(passwordHash('short'));
 for(const email of emails)await db.prepare('INSERT INTO admin_accounts(email,password_hash) VALUES(?,?)').bind(email,saved).run();
 assert.equal(ready().status,0);
 let token='';let options:Record<string,unknown>={};
 const context=(email:string,pass=password,action='login',cookie='')=>({request:new Request('https://book.test/admin/'+action,{method:'POST',headers:{origin:env.PUBLIC_ORIGIN,'x-real-ip':'192.0.2.44','content-type':'application/json',cookie},body:JSON.stringify({email,password:pass,contact_url:'',formToken:formToken(env,'owner',action)})}),locals:{owner:'owner'},cookies:{set:(name:string,value:string,opts:Record<string,unknown>)=>{assert.equal(name,'__Host-admin');token=value;options=opts;},delete:()=>{}}}) as unknown as APIContext;
 const request=(value=token)=>new Request('https://book.test/admin',{headers:{cookie:'__Host-admin='+value}});
 try{
  for(const email of emails){assert.equal(await signIn(context(email),env),email);assert.equal(await administrator(request(),env),email);assert.equal(options.secure,true);assert.equal(options.httpOnly,true);assert.equal(options.sameSite,'strict');const rows=await db.prepare('SELECT token_hash FROM admin_sessions').all();assert.ok(!JSON.stringify(rows).includes(token));}
  await assert.rejects(signIn(context(emails[0],'incorrect'),env));await assert.rejects(signIn(context('stranger@example.com'),env));
  await assert.rejects(administrator(request('f'.repeat(64)),env));await assert.rejects(administrator(new Request('https://book.test/admin'),env));
  await signOut(context(emails[1],password,'logout','__Host-admin='+token),env);await assert.rejects(administrator(request(),env));
  await signIn(context(emails[0]),env);await db.prepare('UPDATE admin_sessions SET expires_at=1 WHERE token_hash=?').bind(await hash(token)).run();await assert.rejects(administrator(request(),env));
  await signIn(context(emails[0]),env);await db.batch([db.prepare('UPDATE admin_accounts SET password_hash=? WHERE email=?').bind(await passwordHash('a different test password'),emails[0]),db.prepare('DELETE FROM admin_sessions WHERE email=?').bind(emails[0])]);await assert.rejects(administrator(request(),env));
  await assert.rejects(signIn(context(emails[0]),env));
  const bad=context(emails[1]);bad.request=new Request('https://book.test/admin/login',{method:'POST',headers:{origin:'https://evil.test'}});await assert.rejects(signIn(bad,env));
  assert.throws(()=>clientIP(new Request('https://book.test',{headers:{'cf-connecting-ip':'192.0.2.2','x-forwarded-for':'192.0.2.2'}}),env));
  assert.throws(()=>clientIP(new Request('https://book.test',{headers:{'x-real-ip':'garbage'}}),env));
  const now=Math.floor(Date.now()/1000);const bucket=`login:network:${await hash(env.RATE_LIMIT_SALT+':192.0.2.44')}:${Math.floor(now/900)}`;
  await db.prepare('UPDATE rate_limits SET count=10 WHERE bucket=?').bind(bucket).run();await assert.rejects(signIn(context(emails[1]),env),(error:any)=>error.status===429);
 }finally{db.close();await rm(directory,{recursive:true,force:true});}
});
