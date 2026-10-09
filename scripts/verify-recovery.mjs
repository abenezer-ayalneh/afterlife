import {mkdtemp,readFile,rm,mkdir,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import assert from 'node:assert/strict';
const run=promisify(execFile),root=resolve('.'),directory=await mkdtemp(join(tmpdir(),'afterlife-recovery-'));
const wrangler=resolve('node_modules/wrangler/bin/wrangler.js');
async function command(args,config){return (await run(process.execPath,[wrangler,...args,'--config',config],{cwd:root,maxBuffer:1024*1024})).stdout;}
try{
  const source=join(directory,'source','wrangler.json'),restored=join(directory,'restored','wrangler.json'),dump=join(directory,'backup.sql');
  for(const config of [source,restored]){await mkdir(resolve(config,'..'),{recursive:true});await writeFile(config,JSON.stringify({name:'afterlife-recovery-test',compatibility_date:'2026-10-09',d1_databases:[{binding:'DB',database_name:'afterlife-recovery',database_id:'00000000-0000-0000-0000-000000000010',migrations_dir:resolve('migrations')}]}));}
  await command(['d1','migrations','apply','DB','--local'],source);
  await command(['d1','execute','DB','--local','--command',"INSERT INTO ratings(chapter_id,owner_hash,score,version) VALUES(1,'recovery-test-owner',10,1); INSERT INTO comments(id,chapter_id,owner_hash,body) VALUES('recovery-comment',1,'recovery-test-owner','Unicode 📖 recovery');"],source);
  await command(['d1','export','DB','--local','--output',dump],source);
  assert.ok((await readFile(dump,'utf8')).includes('Unicode 📖 recovery'));
  await command(['d1','execute','DB','--local','--file',dump],restored);
  const query=['d1','execute','DB','--local','--command','SELECT (SELECT COUNT(*) FROM chapters) AS chapters,(SELECT COUNT(*) FROM ratings) AS ratings,(SELECT score FROM ratings WHERE chapter_id=1) AS score,(SELECT body FROM comments LIMIT 1) AS comment','--json'];
  const original=JSON.parse(await command(query,source));const copy=JSON.parse(await command(query,restored));assert.deepEqual(copy[0].results,original[0].results);
  assert.equal(copy[0].results[0].score,10);console.log('Recovery verified: isolated SQL export/restore preserves chapters, ratings and Unicode comments.');
}finally{await rm(directory,{recursive:true,force:true});}
