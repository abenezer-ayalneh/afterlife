import type { APIContext } from 'astro';
import {createHmac,randomBytes,timingSafeEqual} from 'node:crypto';
import {isIP} from 'node:net';
import { Problem } from './model';

import type { Runtime } from './runtime';
export type { Runtime } from './runtime';
const localHosts = new Set(['localhost','127.0.0.1','[::1]']);
export function isLocal(request:Request,env:Runtime) { return !!import.meta.env?.DEV && env.APP_ENV==='local' && localHosts.has(new URL(request.url).hostname); }
export async function hash(value:string) {
  return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value))), b=>b.toString(16).padStart(2,'0')).join('');
}
export async function reader(context:APIContext) {
  let value=context.cookies.get('__Host-reader')?.value;
  const secure=new URL(context.request.url).protocol==='https:';
  const name=secure?'__Host-reader':'reader-local';
  if(!secure) value=context.cookies.get(name)?.value;
  if(!value || !/^[a-f\d]{64}$/.test(value)) {
    value=Array.from(crypto.getRandomValues(new Uint8Array(32)),b=>b.toString(16).padStart(2,'0')).join('');
    context.cookies.set(name,value,{httpOnly:true,secure,sameSite:'lax',path:'/',maxAge:60*60*24*365});
  }
  return hash(value);
}
// Nginx overwrites these headers and the Node port is loopback-only.
// Reject contradictory values even if the adapter drops an invalid forwarded host.
export function canonicalRequest(request:Request,env:Runtime) {
  const origin=new URL(env.PUBLIC_ORIGIN);
  if(new URL(request.url).origin!==origin.origin) throw new Problem(403,'Please use the website’s main address.');
  for(const name of ['host','x-forwarded-host']) {
    const value=request.headers.get(name);
    if(value && value!==origin.host) throw new Problem(403,'Please use the website’s main address.');
  }
  const protocol=request.headers.get('x-forwarded-proto');
  const port=request.headers.get('x-forwarded-port');
  if((protocol && protocol!==origin.protocol.slice(0,-1)) || (port && port!==(origin.port||'443')) || request.headers.has('forwarded')) throw new Problem(403,'Please use the website’s main address.');
}
export function sameOrigin(request:Request,env:Runtime) {
  const url=new URL(request.url);
  if(!isLocal(request,env) && (!env.PUBLIC_ORIGIN || url.origin!==env.PUBLIC_ORIGIN)) throw new Problem(403,'Please use the website’s main address.');
  if(request.headers.get('origin')!==url.origin) throw new Problem(403,'Please submit this form from the website.');
  const site=request.headers.get('sec-fetch-site');
  if(site && site!=='same-origin' && site!=='none') throw new Problem(403,'Please submit this form from the website.');
}
export async function readBody(request:Request):Promise<Record<string,unknown>> {
  const stream=request.body?.getReader(); if(!stream) throw new Problem(400,'The form is empty.');
  const chunks:Uint8Array[]=[];let length=0;
  while(true) { const {value,done}=await stream.read(); if(done) break;length+=value.byteLength;if(length>16384){await stream.cancel();throw new Problem(413,'The submitted form is too large.');}chunks.push(value); }
  const buffer=new Uint8Array(length);let offset=0;for(const chunk of chunks){buffer.set(chunk,offset);offset+=chunk.length;}
  const input=new TextDecoder().decode(buffer);
  try {
    if(request.headers.get('content-type')?.includes('application/json')) {
      const body:unknown=JSON.parse(input);if(!body || typeof body!=='object' || Array.isArray(body)) throw new Error();return body as Record<string,unknown>;
    }
    if(request.headers.get('content-type')?.includes('application/x-www-form-urlencoded')) return Object.fromEntries(new URLSearchParams(input));
  } catch { throw new Problem(400,'The form could not be read. Reload and try again.'); }
  throw new Problem(415,'Please use the website’s form to submit.');
}
export async function rateLimit(request:Request,env:Runtime,owner:string) {
  const now=Math.floor(Date.now()/1000);const window=Math.floor(now/60);
  if(!isLocal(request,env) && !env.RATE_LIMIT_SALT) throw new Problem(503,'Submissions are temporarily unavailable. Please try again later.');
  const ip=clientIP(request,env);
  const buckets=[`reader:${owner}:${window}`];
  if(ip) buckets.push(`network:${await hash((env.RATE_LIMIT_SALT||'local')+':'+ip)}:${window}`);
  for(const [i,bucket] of buckets.entries()) {
    const row=await env.DB.prepare('INSERT INTO rate_limits(bucket,count,expires_at) VALUES (?,1,?) ON CONFLICT(bucket) DO UPDATE SET count=count+1 RETURNING count').bind(bucket,now+120).first<{count:number}>();
    if(!row || row.count>(i===0?15:60)) throw new Problem(429,'You have submitted several forms recently. Wait a minute and try again.');
  }
  await env.DB.prepare('DELETE FROM rate_limits WHERE expires_at < ?').bind(now).run();
}
export function clientIP(request:Request,env:Runtime) {
 const value=request.headers.get('x-real-ip');
 if(value && isIP(value))return value;
 if(isLocal(request,env))return '127.0.0.1';
 throw new Problem(503,'Request protection is unavailable. Please try again later.');
}
export function formToken(env:Runtime,owner:string,action:string,now=Date.now()) {
 const payload=Buffer.from(JSON.stringify({owner,action,issued:now,nonce:randomBytes(16).toString('hex')})).toString('base64url');
 const signature=createHmac('sha256',env.RATE_LIMIT_SALT).update('form:'+payload).digest('hex');
 return payload+'.'+signature;
}
export function verifyForm(env:Runtime,owner:string,body:Record<string,unknown>,action:string,now=Date.now()) {
 if(typeof body.contact_url!=='string' || body.contact_url!=='')throw new Problem(400,'The form could not be verified. Reload and try again.');
 const token=body.formToken;if(typeof token!=='string' || token.length>1000)throw new Problem(400,'The form expired. Reload and try again.');
 try {
  const [payload,signature,...extra]=token.split('.');
  if(extra.length || !/^[a-f\d]{64}$/.test(signature||''))throw new Error();
  const expected=createHmac('sha256',env.RATE_LIMIT_SALT).update('form:'+payload).digest();
  if(!timingSafeEqual(expected,Buffer.from(signature,'hex')))throw new Error();
  const saved=JSON.parse(Buffer.from(payload,'base64url').toString('utf8'));
  if(saved.owner!==owner || saved.action!==action || !Number.isSafeInteger(saved.issued) || saved.issued>now || now-saved.issued>4*60*60*1000)throw new Error();
  if(['rating','comment','edit','delete','report'].includes(action) && now-saved.issued<1000)throw new Problem(400,'Please wait a moment before submitting. Your text is preserved.');
 }catch(error){if(error instanceof Problem)throw error;throw new Problem(400,'The form expired or could not be verified. Reload and try again.');}
}
