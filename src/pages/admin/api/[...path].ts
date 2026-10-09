import type {APIRoute} from 'astro';
import {env} from '../../../lib/runtime';
import {sameOrigin,readBody} from '../../../lib/security';
import {manage,exportCSV} from '../../../lib/admin';
import {Problem} from '../../../lib/model';
export const ALL:APIRoute=async context=>{
  if(!context.locals.admin)throw new Problem(403,'Administrator access required.');
  const path=context.params.path||'';
  if(context.request.method==='GET'&&path.startsWith('export/'))return exportCSV(env.DB,path.slice(7));
  if(context.request.method!=='POST')throw new Problem(405,'Please use an administrator form.');
  sameOrigin(context.request,env);const body=await readBody(context.request);await manage(env.DB,path,body);
  return context.redirect(`/admin?saved=${encodeURIComponent(path)}`,303);
};
