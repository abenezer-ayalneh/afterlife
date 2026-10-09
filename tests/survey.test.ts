import {test,before,after} from 'node:test';
import assert from 'node:assert/strict';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {openDatabase,migrate} from '../src/lib/sqlite-core.mjs';
import type {Database} from '../src/lib/sqlite';
import {chapters,results,ownRating,saveRating,postComment,comments,updateComment,deleteComment,reportComment} from '../src/lib/db';
import {integer,text,csvCell} from '../src/lib/model';
import {manage,exportCSV} from '../src/lib/admin';
import {readBody,sameOrigin,formToken,verifyForm,rateLimit,type Runtime} from '../src/lib/security';

let directory:string;let db:Database;
before(async()=>{directory=await mkdtemp(join(tmpdir(),'afterlife-tests-'));const sqlite=openDatabase(join(directory,'survey.sqlite'));migrate(sqlite);migrate(sqlite);db=sqlite as Database;});
after(async()=>{db.close();await rm(directory,{recursive:true,force:true})});
test('seeds all eleven official chapters at permanent addresses',async()=>{assert.deepEqual(await chapters(db),[{"id": 1, "title": "Religion"}, {"id": 2, "title": "Philosophy"}, {"id": 3, "title": "Out-of-Body Experiences"}, {"id": 4, "title": "Near-Death Experiences"}, {"id": 5, "title": "Children's Past Lives"}, {"id": 6, "title": "Adults' Past Lives"}, {"id": 7, "title": "End-of-Life Phenomena"}, {"id": 8, "title": "After Death Encounters"}, {"id": 9, "title": "Agents of the Dead (Mediums)"}, {"id": 10, "title": "Mystica"}, {"id": 11, "title": "Consciousness"}]);});
test('integer score validation accepts 0 and 10, rejects missing, fractional and range violations',()=>{
  assert.equal(integer('0',0,10,'score'),0);assert.equal(integer(10,0,10,'score'),10);
  for(const value of [undefined,null,'',-1,11,1.5,'2.5',true,NaN])assert.throws(()=>integer(value,0,10,'score'));
});
test('empty results have no average',async()=>{assert.deepEqual(await results(db,9),{count:0,average:null,distribution:Array(11).fill(0)});});
test('rating revision and delayed retries keep exactly one response',async()=>{
  const initial=crypto.randomUUID();await saveRating(db,1,'owner-a',0,0,initial);const update=crypto.randomUUID();await saveRating(db,1,'owner-a',10,1,update);
  await saveRating(db,1,'owner-a',0,0,initial);await saveRating(db,1,'owner-a',10,1,update);
  assert.deepEqual(await ownRating(db,1,'owner-a'),{score:10,version:2});const r=await results(db,1);assert.equal(r.count,1);assert.equal(r.average,10);assert.equal(r.distribution[0],0);assert.equal(r.distribution[10],1);
});
test('concurrent revisions reject a stale version and duplicate requests are idempotent',async()=>{
  const key=crypto.randomUUID();await Promise.all([saveRating(db,2,'owner-b',5,0,key),saveRating(db,2,'owner-b',5,0,key)]);
  const revisions=await Promise.allSettled([saveRating(db,2,'owner-b',0,1,crypto.randomUUID()),saveRating(db,2,'owner-b',10,1,crypto.randomUUID())]);assert.equal(revisions.filter(r=>r.status==='fulfilled').length,1);assert.equal((await results(db,2)).count,1);
});
test('another browser has separate ratings and cannot reuse a receipt',async()=>{
  const key=crypto.randomUUID();await saveRating(db,3,'a',4,0,key);await assert.rejects(saveRating(db,3,'b',9,0,key));assert.equal(await ownRating(db,3,'b'),null);await saveRating(db,3,'b',6,0,crypto.randomUUID());assert.equal((await results(db,3)).average,5);
});
test('comments are independent, support Unicode and retries, and protect ownership',async()=>{
  const id=crypto.randomUUID();await postComment(db,4,'comment-owner',id,'','ሰላም · 日本語 · 📖');await postComment(db,4,'comment-owner',id,'','ሰላም · 日本語 · 📖');
  assert.equal((await results(db,4)).count,0);const list=await comments(db,4,'other');assert.equal(list.items.length,1);assert.equal(list.items[0].author,null);assert.equal(list.items[0].owned,false);assert.ok(!JSON.stringify(list).includes('owner_hash'));
  await assert.rejects(updateComment(db,id,'other',1,'','stolen'));await assert.rejects(deleteComment(db,id,'other'));
  await updateComment(db,id,'comment-owner',1,'Reader','Edited 📖');assert.equal((await comments(db,4,'comment-owner')).items[0].body,'Edited 📖');
});
test('reports do not hide comments; moderation hides/restores; reader deletion cannot be restored',async()=>{
  const id=crypto.randomUUID();await postComment(db,5,'owner',id,'Name','A comment');await reportComment(db,id,'reporter','Off topic');assert.equal((await comments(db,5,'')).items.length,1);
  await manage(db,'hide',{comment:id});assert.equal((await comments(db,5,'')).items.length,0);await manage(db,'restore',{comment:id});assert.equal((await comments(db,5,'')).items.length,1);
  await deleteComment(db,id,'owner');await deleteComment(db,id,'owner');await assert.rejects(manage(db,'restore',{comment:id}));const tombstone=await db.prepare('SELECT body,author FROM comments WHERE id=?').bind(id).first();assert.deepEqual(tombstone,{body:'',author:null});
});
test('comment pagination has no overlap or missing items',async()=>{
  for(let i=0;i<25;i++)await postComment(db,6,'pagination',crypto.randomUUID(),'Reader',`Comment ${i}`);
  const first=await comments(db,6,'pagination');assert.equal(first.items.length,20);assert.ok(first.next);const second=await comments(db,6,'pagination',first.next!);assert.equal(second.items.length,5);assert.equal(new Set([...first.items,...second.items].map(c=>c.id)).size,25);
});
test('renaming preserves responses and adding is immediate and retry-safe',async()=>{
  await manage(db,'rename',{chapter:1,title:'A final chapter title'});assert.equal((await chapters(db))[0].title,'A final chapter title');assert.equal((await results(db,1)).count,1);
  const key=crypto.randomUUID();await manage(db,'add',{title:'Additional chapter',requestId:key});await manage(db,'add',{title:'Additional chapter',requestId:key});assert.equal((await chapters(db)).length,12);
  await assert.rejects(db.prepare('UPDATE chapters SET id=22 WHERE id=1').run());await assert.rejects(db.prepare('DELETE FROM chapters WHERE id=1').run());
});
test('CSV exports exclude ownership credentials and escape spreadsheet formulas',async()=>{
  const id=crypto.randomUUID();await postComment(db,7,'secret-browser-hash',id,'=SUM(A1:A2)','@formula');const response=await exportCSV(db,'comments');const output=await response.text();assert.ok(output.includes("'=SUM"));assert.ok(output.includes("'@formula"));assert.ok(!output.includes('owner_hash'));assert.ok(!output.includes('secret-browser-hash'));
  assert.equal(csvCell(' \t=1+1'),'"\' \t=1+1"');assert.equal(csvCell('hello, "reader"'),'"hello, ""reader"""');
});
test('text and request limits reject invalid bodies and preserve Unicode',async()=>{
  assert.equal(text(' 📖 ',2),'📖');assert.throws(()=>text('a'.repeat(2001),2000));assert.throws(()=>text('\0',2000));
  await assert.rejects(readBody(new Request('https://book.test',{method:'POST',headers:{'Content-Type':'application/json'},body:'x'.repeat(16385)})));
  await assert.rejects(readBody(new Request('https://book.test',{method:'POST',headers:{'Content-Type':'application/json'},body:'[]'})));
});
test('consistent SQLite backup restores into an isolated database',async()=>{
  const {stdout}=await promisify(execFile)(process.execPath,['scripts/verify-recovery.mjs']);assert.ok(stdout.includes('Recovery verified'));
});
test('local form protection rejects tampering, wrong action/owner, expiry, honeypots and instant submissions',async()=>{
 const runtime:Runtime={DB:db,APP_ENV:'production',PUBLIC_ORIGIN:'https://book.test',RATE_LIMIT_SALT:'x'.repeat(32),ADMIN_EMAILS:[]};
 const now=Date.now();const body={contact_url:'',formToken:formToken(runtime,'owner','rating',now-2000)};
 verifyForm(runtime,'owner',body,'rating',now);
 for(const patch of [{contact_url:'spam'},{formToken:''},{formToken:body.formToken+'x'},{formToken:formToken(runtime,'owner','rating',now-15000000)},{formToken:formToken(runtime,'owner','rating',now)}])assert.throws(()=>verifyForm(runtime,'owner',{...body,...patch},'rating',now));
 assert.throws(()=>verifyForm(runtime,'other',body,'rating',now));assert.throws(()=>verifyForm(runtime,'owner',body,'comment',now));
 assert.throws(()=>sameOrigin(new Request('https://book.test/api',{method:'POST',headers:{Origin:'https://evil.test'}}),runtime));
 const request=new Request('https://book.test/api',{headers:{'x-real-ip':'192.0.2.55'}});
 for(let i=0;i<15;i++)await rateLimit(request,runtime,'rate-test');await assert.rejects(rateLimit(request,runtime,'rate-test'));
});

test('transaction failure rolls back earlier writes',async()=>{
  await assert.rejects(db.batch([db.prepare('INSERT INTO ratings(chapter_id,owner_hash,score,version) VALUES(8,?,5,1)').bind('rollback'),db.prepare('INSERT INTO ratings(chapter_id,owner_hash,score,version) VALUES(8,?,11,1)').bind('invalid')]));
  assert.equal(await ownRating(db,8,'rollback'),null);
});
test('CSV snapshot excludes later writes',async()=>{
 const response=await exportCSV(db,'comments');
 await postComment(db,8,'later',crypto.randomUUID(),'','AFTER SNAPSHOT');
 assert.ok(!(await response.text()).includes('AFTER SNAPSHOT'));
});
