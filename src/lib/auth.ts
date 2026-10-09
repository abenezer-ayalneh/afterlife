import {randomBytes} from 'node:crypto';
import type {APIContext} from 'astro';
import {passwordMatches,dummyHash} from './passwords.mjs';
import {hash,readBody,sameOrigin,verifyForm,clientIP} from './security';
import {Problem} from './model';
import type {Runtime} from './runtime';
const sessionSeconds=12*60*60;
let activeLogins=0;
export function sessionCookie(request:Request) {return new URL(request.url).protocol==='https:'?'__Host-admin':'admin-local';}
function tokenFrom(request:Request) {
 const name=sessionCookie(request);const value=request.headers.get('cookie')?.split(';').map(part=>part.trim()).find(part=>part.startsWith(name+'='))?.slice(name.length+1);
 return value && /^[a-f\d]{64}$/.test(value)?value:null;
}
export async function administrator(request:Request,env:Runtime) {
 if(new URL(request.url).origin!==env.PUBLIC_ORIGIN)throw new Problem(403,'Please use the website’s main address.');
 const token=tokenFrom(request);if(!token)throw new Problem(401,'Please sign in to the administrator workspace.');
 const session=await env.DB.prepare('SELECT email FROM admin_sessions WHERE token_hash=? AND expires_at>?').bind(await hash(token),Math.floor(Date.now()/1000)).first<{email:string}>();
 if(!session || !env.ADMIN_EMAILS.includes(session.email))throw new Problem(401,'Your session expired. Please sign in again.');
 return session.email;
}
async function loginLimit(request:Request,env:Runtime,email:string) {
 const now=Math.floor(Date.now()/1000),window=Math.floor(now/900);
 const ip=clientIP(request,env);
 const buckets=[['network',ip,10],['account',email,10]] as const;
 for(const [kind,identity,limit] of buckets){
  const key=`login:${kind}:${await hash(env.RATE_LIMIT_SALT+':'+identity)}:${window}`;
  const saved=await env.DB.prepare('INSERT INTO rate_limits(bucket,count,expires_at) VALUES(?,1,?) ON CONFLICT(bucket) DO UPDATE SET count=count+1 RETURNING count').bind(key,now+1800).first<{count:number}>();
  if(!saved || saved.count>limit)throw new Problem(429,'Too many sign-in attempts. Try again in fifteen minutes.');
 }
 await env.DB.prepare('DELETE FROM rate_limits WHERE expires_at<?').bind(now).run();
}
export async function signIn(context:APIContext,env:Runtime) {
 sameOrigin(context.request,env);
 const body=await readBody(context.request);
 const email=typeof body.email==='string'?body.email.trim().toLowerCase().slice(0,254):'';
 await loginLimit(context.request,env,email);
 verifyForm(env,context.locals.owner,body,'login');
 if(activeLogins>=2)throw new Problem(429,'Sign-in is busy. Please try again shortly.');
 activeLogins++;
 try {
  const account=await env.DB.prepare('SELECT password_hash FROM admin_accounts WHERE email=?').bind(email).first<{password_hash:string}>();
  const valid=await passwordMatches(body.password,account?.password_hash||dummyHash);
  if(!valid || !account || !env.ADMIN_EMAILS.includes(email))throw new Problem(401,'The email or password is incorrect.');
  const token=randomBytes(32).toString('hex'),now=Math.floor(Date.now()/1000);
  await env.DB.batch([
   env.DB.prepare('DELETE FROM admin_sessions WHERE expires_at<=?').bind(now),
   env.DB.prepare('INSERT INTO admin_sessions(token_hash,email,expires_at) SELECT ?,email,? FROM admin_accounts WHERE email=? AND password_hash=?').bind(await hash(token),now+sessionSeconds,email,account.password_hash),
  ]);
  // A password reset during hashing must not create a valid session afterwards.
  const session=await env.DB.prepare('SELECT token_hash FROM admin_sessions WHERE token_hash=?').bind(await hash(token)).first();
  if(!session)throw new Problem(401,'The email or password is incorrect.');
  const previous=tokenFrom(context.request);
  if(previous)await env.DB.prepare('DELETE FROM admin_sessions WHERE token_hash=?').bind(await hash(previous)).run();
  context.cookies.set(sessionCookie(context.request),token,{httpOnly:true,secure:new URL(context.request.url).protocol==='https:',sameSite:'strict',path:'/',maxAge:sessionSeconds});
  return email;
 }finally{activeLogins--;}
}
export async function signOut(context:APIContext,env:Runtime) {
 sameOrigin(context.request,env);verifyForm(env,context.locals.owner,await readBody(context.request),'logout');
 const token=tokenFrom(context.request);if(token)await env.DB.prepare('DELETE FROM admin_sessions WHERE token_hash=?').bind(await hash(token)).run();
 context.cookies.delete(sessionCookie(context.request),{path:'/'});
}
