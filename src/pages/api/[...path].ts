import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { publicAPI } from '../../lib/public-api';
export const ALL:APIRoute = context=>publicAPI(context,env);
