import { Problem, type Chapter, type Rating, type Results, type Comment } from './model';

export const chapters = async (db: D1Database) => (await db.prepare('SELECT id,title FROM chapters ORDER BY id').all<Chapter>()).results;
export async function chapter(db: D1Database, id: number) {
  const result = await db.prepare('SELECT id,title FROM chapters WHERE id=?').bind(id).first<Chapter>();
  if (!result) throw new Problem(404, 'This chapter could not be found.');
  return result;
}
export async function results(db: D1Database, id: number): Promise<Results> {
  const rows = (await db.prepare('SELECT score,COUNT(*) AS count FROM ratings WHERE chapter_id=? GROUP BY score').bind(id).all<{score:number;count:number}>()).results;
  const distribution = Array<number>(11).fill(0);
  for (const row of rows) distribution[row.score] = row.count;
  const count = distribution.reduce((a,b) => a+b,0);
  return {count, average:count ? distribution.reduce((a,b,i)=>a+b*i,0)/count : null, distribution};
}
export const ownRating = (db:D1Database,id:number,owner:string) => db.prepare('SELECT score,version FROM ratings WHERE chapter_id=? AND owner_hash=?').bind(id,owner).first<Rating>();
export async function saveRating(db:D1Database,id:number,owner:string,score:number,base:number,key:string) {
  // The receipt and update are one D1 transaction. Retried older receipts never overwrite a later revision.
  await db.batch([
    db.prepare(`INSERT OR IGNORE INTO rating_requests(request_id,chapter_id,owner_hash,score,base_version)
      SELECT ?,?,?,?,? WHERE COALESCE((SELECT version FROM ratings WHERE chapter_id=? AND owner_hash=?),0)=?`).bind(key,id,owner,score,base,id,owner,base),
    db.prepare(`INSERT INTO ratings(chapter_id,owner_hash,score,version)
      SELECT chapter_id,owner_hash,score,base_version+1 FROM rating_requests WHERE request_id=? AND chapter_id=? AND owner_hash=? AND score=? AND base_version=?
      ON CONFLICT(chapter_id,owner_hash) DO UPDATE SET score=excluded.score,version=excluded.version,updated_at=strftime('%Y-%m-%dT%H:%M:%fZ','now')
      WHERE ratings.version=excluded.version-1`).bind(key,id,owner,score,base)
  ]);
  const receipt=await db.prepare('SELECT score,base_version FROM rating_requests WHERE request_id=? AND owner_hash=? AND chapter_id=?').bind(key,owner,id).first<{score:number;base_version:number}>();
  if (!receipt || receipt.score!==score || receipt.base_version!==base) throw new Problem(409,'Your rating changed in another tab. Reload to see it before updating.');
  return ownRating(db,id,owner);
}
export async function comments(db:D1Database,id:number,owner:string,cursor?:string) {
  let boundary: {created_at:string;id:string} | undefined;
  if(cursor) {
    try { boundary=JSON.parse(atob(cursor)); } catch { throw new Problem(400,'Invalid comment page.'); }
    if(!boundary || typeof boundary.created_at!=='string' || typeof boundary.id!=='string' || cursor.length>300) throw new Problem(400,'Invalid comment page.');
  }
  const sql=`SELECT id,chapter_id,author,body,created_at,updated_at,version,(owner_hash=?) AS owned FROM comments WHERE chapter_id=? AND hidden=0 AND deleted_at IS NULL ${boundary?'AND (created_at < ? OR (created_at = ? AND id < ?))':''} ORDER BY created_at DESC,id DESC LIMIT 21`;
  const values: (string|number)[]=[owner,id];
  if(boundary) values.push(boundary.created_at,boundary.created_at,boundary.id);
  const rows=(await db.prepare(sql).bind(...values).all<Omit<Comment,'owned'> & {owned:number}>()).results;
  const more=rows.length>20; const items=rows.slice(0,20).map(row=>({...row,owned:!!row.owned})); const last=items.at(-1);
  return {items,next:more&&last?btoa(JSON.stringify({created_at:last.created_at,id:last.id})):null};
}
export async function postComment(db:D1Database,id:number,owner:string,key:string,author:string,body:string) {
  await db.prepare('INSERT OR IGNORE INTO comments(id,chapter_id,owner_hash,author,body) VALUES (?,?,?,?,?)').bind(key,id,owner,author||null,body).run();
  const saved=await db.prepare('SELECT id FROM comments WHERE id=? AND chapter_id=? AND owner_hash=? AND body=? AND COALESCE(author,\'\')=? AND deleted_at IS NULL').bind(key,id,owner,body,author).first();
  if(!saved) throw new Problem(409,'This comment was already changed. Reload before posting again.');
}
export async function updateComment(db:D1Database,key:string,owner:string,version:number,author:string,body:string) {
  const change=await db.prepare(`UPDATE comments SET author=?,body=?,version=version+1,updated_at=strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id=? AND owner_hash=? AND version=? AND deleted_at IS NULL`).bind(author||null,body,key,owner,version).run();
  if(!change.meta.changes) throw new Problem(409,'The comment could not be edited. Reload to check that it is yours and has not changed.');
}
export async function deleteComment(db:D1Database,key:string,owner:string) {
  const found=await db.prepare('SELECT id FROM comments WHERE id=? AND owner_hash=?').bind(key,owner).first();
  if(!found) throw new Problem(403,'You can only delete your own comments from the browser that posted them.');
  await db.batch([
    db.prepare("UPDATE comments SET body='',author=NULL,deleted_at=COALESCE(deleted_at,strftime('%Y-%m-%dT%H:%M:%fZ','now')) WHERE id=? AND owner_hash=?").bind(key,owner),
    db.prepare('DELETE FROM reports WHERE comment_id=?').bind(key)
  ]);
}
export async function reportComment(db:D1Database,key:string,owner:string,reason:string) {
  const found=await db.prepare('SELECT id FROM comments WHERE id=? AND hidden=0 AND deleted_at IS NULL').bind(key).first();
  if(!found) throw new Problem(404,'This comment is no longer available.');
  await db.prepare('INSERT INTO reports(comment_id,owner_hash,reason) VALUES (?,?,?) ON CONFLICT(comment_id,owner_hash) DO UPDATE SET reason=excluded.reason,resolved_at=NULL').bind(key,owner,reason).run();
}
