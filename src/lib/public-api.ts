import type { APIContext } from 'astro';
import { chapter, comments, results, ownRating, saveRating, postComment, updateComment, deleteComment, reportComment } from './db';
import { Problem, integer, text, requestId, escapeHTML } from './model';
import { sameOrigin, readBody, rateLimit, verifyTurnstile, type Runtime } from './security';

export async function publicAPI(context:APIContext,env:Runtime) {
  const {request,locals,url}=context;const parts=(context.params.path||'').split('/');
  let body:Record<string,unknown>={};let chapterId:number|undefined;
  const wantsJSON=request.headers.get('accept')?.includes('application/json');
  try {
    if(parts[0]==='chapters' && parts.length===3) {
      chapterId=integer(parts[1],1,100000,'Invalid chapter.');await chapter(env.DB,chapterId);
      const action=parts[2];
      if(request.method==='GET' && action==='results') return Response.json({...await results(env.DB,chapterId),rating:await ownRating(env.DB,chapterId,locals.owner)});
      if(request.method==='GET' && action==='comments') return Response.json(await comments(env.DB,chapterId,locals.owner,url.searchParams.get('cursor')||undefined));
      if(request.method!=='POST' || !['rating','comments'].includes(action)) throw new Problem(405,'This action is unavailable.');
      sameOrigin(request,env);body=await readBody(request);await rateLimit(request,env,locals.owner);
      await verifyTurnstile(request,env,body,action==='rating'?'rating':'comment');
      if(action==='rating') {
        const score=integer(body.score,0,10,'Choose a whole-number rating from 0 to 10.');
        const base=integer(body.version,0,Number.MAX_SAFE_INTEGER-1,'Reload the rating form and try again.');
        const rating=await saveRating(env.DB,chapterId,locals.owner,score,base,requestId(body.requestId));
        return wantsJSON?Response.json({message:'Your rating has been saved.',rating,results:await results(env.DB,chapterId)}):context.redirect(`/chapters/${chapterId}?saved=rating`,303);
      }
      await postComment(env.DB,chapterId,locals.owner,requestId(body.requestId),text(body.author||'',60,false),text(body.body,2000));
      return wantsJSON?Response.json({message:'Your comment has been posted.'},{status:201}):context.redirect(`/chapters/${chapterId}?saved=comment#comments`,303);
    }
    if(parts[0]==='comments' && parts.length===3 && request.method==='POST') {
      const key=requestId(parts[1]);const action=parts[2];
      if(!['edit','delete','report'].includes(action)) throw new Problem(404,'Action not found.');
      const row=await env.DB.prepare('SELECT chapter_id FROM comments WHERE id=?').bind(key).first<{chapter_id:number}>();
      if(!row) throw new Problem(404,'This comment could not be found.');chapterId=row.chapter_id;
      sameOrigin(request,env);body=await readBody(request);await rateLimit(request,env,locals.owner);await verifyTurnstile(request,env,body,action);
      if(action==='edit') await updateComment(env.DB,key,locals.owner,integer(body.version,1,Number.MAX_SAFE_INTEGER-1,'Reload the comment before editing.'),text(body.author||'',60,false),text(body.body,2000));
      if(action==='delete') await deleteComment(env.DB,key,locals.owner);
      if(action==='report') await reportComment(env.DB,key,locals.owner,text(body.reason,500));
      const message={edit:'Your comment has been updated.',delete:'Your comment has been deleted.',report:'Thank you. Your report has been sent for review.'}[action];
      return wantsJSON?Response.json({message}):context.redirect(`/chapters/${chapterId}?saved=${action}#comments`,303);
    }
    throw new Problem(404,'This action could not be found.');
  } catch(error) {
    const status=error instanceof Problem?error.status:503;
    const message=error instanceof Problem?error.message:'The submission could not be saved. Your text is preserved; try again in a moment.';
    if(!(error instanceof Problem)) console.error(JSON.stringify({event:'submission_failed',path:url.pathname}));
    if(wantsJSON) return Response.json({error:message},{status,headers:status===429?{'Retry-After':'60'}:{}});
    const fields=Object.entries(body).filter(([key])=>key!=='cf-turnstile-response').map(([key,value])=>`<label>${escapeHTML(key)}<textarea name="${escapeHTML(key)}">${escapeHTML(String(value))}</textarea></label>`).join('');
    return new Response(`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Submission needs attention</title><style>body{font:18px/1.6 system-ui;background:#f7f6e9;color:#242823}main{max-width:42rem;margin:8vh auto;padding:24px}label,textarea{display:block}textarea{width:100%;margin:8px 0 24px}button{padding:12px 24px}</style><main><h1>Submission needs attention</h1><p>${escapeHTML(message)}</p><p>Your submitted text is preserved below. Return to the chapter to complete verification and try again.</p><form method="post">${fields}${env.APP_ENV==='local'?'<button>Try again</button>':''}</form><a href="/chapters/${chapterId||1}">Return to chapter</a></main></html>`,{status,headers:{'Content-Type':'text/html; charset=utf-8'}});
  }
}
