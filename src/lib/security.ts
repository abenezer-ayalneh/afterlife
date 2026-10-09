import type { APIContext } from 'astro';
import { createRemoteJWKSet, jwtVerify, type JWTVerifyGetKey } from 'jose';
import { Problem } from './model';

export type Runtime = Cloudflare.Env & {TURNSTILE_SECRET_KEY?:string;RATE_LIMIT_SALT?:string};
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
export function sameOrigin(request:Request,env:Runtime) {
  const url=new URL(request.url);
  if(!isLocal(request,env) && (!env.PUBLIC_ORIGIN || url.origin!==env.PUBLIC_ORIGIN)) throw new Problem(403,'Please use the website’s main address.');
  if(request.headers.get('origin')!==url.origin) throw new Problem(403,'Please submit this form from the website.');
  const site=request.headers.get('sec-fetch-site');
  if(site && site!=='same-origin' && site!=='none') throw new Problem(403,'Please submit this form from the website.');
}
export async function administrator(request:Request,env:Runtime,verificationKeys?:JWTVerifyGetKey) {
  if(!env.PUBLIC_ORIGIN || new URL(request.url).origin!==env.PUBLIC_ORIGIN || !env.ADMIN_EMAIL || !env.ACCESS_AUD || !/^[a-z\d-]+\.cloudflareaccess\.com$/.test(env.ACCESS_TEAM_DOMAIN)) throw new Problem(403,'Administrator access is not configured for this address.');
  const token=request.headers.get('cf-access-jwt-assertion');
  if(!token) throw new Problem(401,'Please sign in through the administrator email code.');
  try {
    const issuer=`https://${env.ACCESS_TEAM_DOMAIN}`;
    const keys=verificationKeys||createRemoteJWKSet(new URL(`${issuer}/cdn-cgi/access/certs`),{timeoutDuration:5000});
    const {payload}=await jwtVerify(token,keys,{issuer,audience:env.ACCESS_AUD,algorithms:['RS256'],requiredClaims:['exp','iat','email','sub'],clockTolerance:5});
    if(typeof payload.email!=='string' || payload.email.toLowerCase()!==env.ADMIN_EMAIL.toLowerCase() || payload.type!=='app') throw new Error('Invalid account');
    return payload.email;
  } catch { throw new Problem(403,'Your administrator session could not be verified. Please sign in again.'); }
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
  const ip=request.headers.get('cf-connecting-ip');
  const buckets=[`reader:${owner}:${window}`];
  if(ip) buckets.push(`network:${await hash((env.RATE_LIMIT_SALT||'local')+':'+ip)}:${window}`);
  for(const [i,bucket] of buckets.entries()) {
    const row=await env.DB.prepare('INSERT INTO rate_limits(bucket,count,expires_at) VALUES (?,1,?) ON CONFLICT(bucket) DO UPDATE SET count=count+1 RETURNING count').bind(bucket,now+120).first<{count:number}>();
    if(!row || row.count>(i===0?15:60)) throw new Problem(429,'You have submitted several forms recently. Wait a minute and try again.');
  }
  await env.DB.prepare('DELETE FROM rate_limits WHERE expires_at < ?').bind(now).run();
}
export async function verifyTurnstile(request:Request,env:Runtime,body:Record<string,unknown>,action:string,siteverify:typeof fetch=fetch) {
  if(isLocal(request,env)) return;
  const token=body['cf-turnstile-response'];
  if(!env.TURNSTILE_SECRET_KEY || !env.TURNSTILE_SITE_KEY) throw new Problem(503,'Submissions are temporarily unavailable. Please try again later.');
  if(typeof token!=='string' || !token || token.length>2048) throw new Problem(400,'Please complete the verification and try again.');
  try {
    const result=await siteverify('https://challenges.cloudflare.com/turnstile/v0/siteverify',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({secret:env.TURNSTILE_SECRET_KEY,response:token,remoteip:request.headers.get('cf-connecting-ip')||undefined}),signal:AbortSignal.timeout(8000)});
    const verification=await result.json() as {success?:boolean;hostname?:string;action?:string};
    if(!result.ok || !verification.success || verification.hostname!==new URL(request.url).hostname || verification.action!==action) throw new Problem(400,'Verification expired or failed. Please verify again.');
  } catch(error) { if(error instanceof Problem) throw error;throw new Problem(503,'Verification is temporarily unavailable. Your text is preserved; please try again.'); }
}
