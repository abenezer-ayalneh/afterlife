import type {APIRoute} from 'astro';
import {signOut} from '../../lib/auth';
import {env} from '../../lib/runtime';
export const POST:APIRoute=async context=>{await signOut(context,env);return context.redirect('/admin/login',303);};
