import {integer,text,requestId,csvCell,Problem} from './model';

export async function manage(db:D1Database,action:string,body:Record<string,unknown>){
  if(action==='rename'){
    const id=integer(body.chapter,1,100000,'Invalid chapter.');const title=text(body.title,200);
    const changed=await db.prepare('UPDATE chapters SET title=? WHERE id=?').bind(title,id).run();if(!changed.meta.changes)throw new Problem(404,'Chapter not found.');return;
  }
  if(action==='add'){
    const title=text(body.title,200),key=requestId(body.requestId);
    await db.batch([
      db.prepare('INSERT INTO chapters(title) SELECT ? WHERE NOT EXISTS (SELECT 1 FROM admin_chapter_requests WHERE request_id=?)').bind(title,key),
      db.prepare('INSERT OR IGNORE INTO admin_chapter_requests(request_id,chapter_id) VALUES (?,(SELECT MAX(id) FROM chapters))').bind(key)
    ]);return;
  }
  if(action==='hide'||action==='restore'){
    const key=requestId(body.comment);
    const change=await db.prepare('UPDATE comments SET hidden=? WHERE id=? AND deleted_at IS NULL').bind(action==='hide'?1:0,key).run();if(!change.meta.changes)throw new Problem(404,'The comment is unavailable or was deleted by its reader.');return;
  }
  if(action==='resolve'){
    const id=integer(body.report,1,Number.MAX_SAFE_INTEGER,'Invalid report.');
    await db.prepare("UPDATE reports SET resolved_at=strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id=?").bind(id).run();return;
  }
  throw new Problem(404,'Management action not found.');
}
export async function exportCSV(db:D1Database,kind:string):Promise<Response>{
  const rating=kind==='ratings';if(!rating&&kind!=='comments')throw new Problem(404,'Export not found.');
  const fields=rating?['chapter_id','chapter_title','score','created_at','updated_at']:['id','chapter_id','chapter_title','author','body','hidden','created_at','updated_at'];
  const job=crypto.randomUUID(),now=Math.floor(Date.now()/1000);
  // Freeze an explicit, credential-free projection in one statement, so concurrent edits cannot shift streamed pages.
  const snapshot=rating?`SELECT ?,ROW_NUMBER() OVER (ORDER BY r.chapter_id,r.owner_hash),json_object('chapter_id',r.chapter_id,'chapter_title',c.title,'score',r.score,'created_at',r.created_at,'updated_at',r.updated_at),? FROM ratings r JOIN chapters c ON c.id=r.chapter_id`:`SELECT ?,ROW_NUMBER() OVER (ORDER BY r.created_at,r.id),json_object('id',r.id,'chapter_id',r.chapter_id,'chapter_title',c.title,'author',r.author,'body',r.body,'hidden',r.hidden,'created_at',r.created_at,'updated_at',r.updated_at),? FROM comments r JOIN chapters c ON c.id=r.chapter_id WHERE r.deleted_at IS NULL`;
  await db.batch([db.prepare('DELETE FROM export_rows WHERE expires_at < ?').bind(now),db.prepare('INSERT INTO export_rows(job_id,position,payload,expires_at) '+snapshot).bind(job,now+300)]);
  const stream=new ReadableStream<Uint8Array>({async start(controller){
    const encoder=new TextEncoder();controller.enqueue(encoder.encode(fields.map(csvCell).join(',')+'\r\n'));
    let offset=0;
    try{
      while(true){
        const rows=(await db.prepare('SELECT position,payload FROM export_rows WHERE job_id=? AND position > ? ORDER BY position LIMIT 500').bind(job,offset).all<{position:number;payload:string}>()).results;
        for(const saved of rows){const row=JSON.parse(saved.payload) as Record<string,unknown>;controller.enqueue(encoder.encode(fields.map(field=>csvCell(row[field])).join(',')+'\r\n'));}
        if(rows.length<500)break;offset=rows.at(-1)!.position;
      }
      controller.close();
    }catch(error){controller.error(error);}finally{await db.prepare('DELETE FROM export_rows WHERE job_id=?').bind(job).run();}
  }});
  return new Response(stream,{headers:{'Content-Type':'text/csv; charset=utf-8','Content-Disposition':`attachment; filename="afterlife-${kind}-${new Date().toISOString().slice(0,10)}.csv"`,'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
}
