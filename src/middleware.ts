import { defineMiddleware } from 'astro:middleware';
import { env } from './lib/runtime';
import { reader, canonicalRequest } from './lib/security';
import { administrator } from './lib/auth';
import { Problem, escapeHTML } from './lib/model';

export const onRequest=defineMiddleware(async(context,next)=>{
  try {
    if (!import.meta.env.DEV) canonicalRequest(context.request,env);
    context.locals.owner=await reader(context);
    if((context.url.pathname==='/admin' || context.url.pathname.startsWith('/admin/')) && context.url.pathname!=='/admin/login') {
      try{context.locals.admin=await administrator(context.request,env);}
      catch(error){if(error instanceof Problem && error.status===401 && !context.url.pathname.startsWith('/admin/api/') && context.request.method==='GET')return new Response(null,{status:303,headers:{Location:'/admin/login','Cache-Control':'no-store'}});throw error;}
    }
    const response=await next();
    response.headers.set('Cache-Control','no-store');
    response.headers.set('X-Content-Type-Options','nosniff');
    response.headers.set('Referrer-Policy','strict-origin-when-cross-origin');
    response.headers.set('Permissions-Policy','camera=(), microphone=(), geolocation=()');
    response.headers.set('X-Frame-Options','DENY');
    // Astro needs its inline theme initializer. All user content is rendered as plain text.
    response.headers.set('Content-Security-Policy',"default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; frame-src 'none'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'");
    return response;
  } catch(error) {
    const status=error instanceof Problem?error.status:503;
    const message=error instanceof Problem?error.message:'This page is temporarily unavailable. Please try again in a moment.';
    if(!(error instanceof Problem)) console.error(JSON.stringify({event:'request_failed',path:context.url.pathname}));
    return context.url.pathname.includes('/api/')?Response.json({error:message},{status,headers:{'Cache-Control':'no-store'}}):new Response(`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Page unavailable</title><main style="max-width:42rem;margin:10vh auto;padding:24px;font:18px/1.6 system-ui"><h1>${status===403||status===401?'Administrator access':'Page unavailable'}</h1><p>${escapeHTML(message)}</p><a href="/">Return to chapters</a></main></html>`,{status,headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'}});
  }
});
