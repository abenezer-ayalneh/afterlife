import type { APIRoute } from 'astro';
import { env } from '../../lib/runtime';
import { publicAPI } from '../../lib/public-api';
export const ALL:APIRoute = context=>publicAPI(context,env);
