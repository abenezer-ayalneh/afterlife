import type { APIRoute } from 'astro';
import {env} from '../lib/runtime';
export const GET:APIRoute=async()=>{
  await env.DB.prepare('SELECT name FROM schema_migrations LIMIT 1').first();
  await env.DB.prepare('SELECT id FROM chapters LIMIT 1').first();
  return Response.json({status:'ok'},{headers:{'Cache-Control':'no-store'}});
};
