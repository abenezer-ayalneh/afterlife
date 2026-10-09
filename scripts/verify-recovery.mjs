import {mkdtemp,rm,copyFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import assert from 'node:assert/strict';
import {openDatabase,migrate} from '../src/lib/sqlite-core.mjs';
const directory=await mkdtemp(join(tmpdir(),'afterlife-recovery-'));
let source,restored;
try {
  source=openDatabase(join(directory,'source.sqlite'));migrate(source);migrate(source);
  source.connection.exec("INSERT INTO ratings(chapter_id,owner_hash,score,version) VALUES(1,'test-owner',10,1); INSERT INTO comments(id,chapter_id,owner_hash,body) VALUES('test-comment',1,'test-owner','Unicode 📖 recovery');");
  await source.backup(join(directory,'backup.sqlite'));
  await copyFile(join(directory,'backup.sqlite'),join(directory,'restored.sqlite'));
  restored=openDatabase(join(directory,'restored.sqlite'));
  for(const table of ['chapters','ratings','comments','schema_migrations']) assert.deepEqual(restored.connection.prepare(`SELECT * FROM ${table}`).all(),source.connection.prepare(`SELECT * FROM ${table}`).all());
  assert.equal(restored.connection.prepare('PRAGMA integrity_check').get().integrity_check,'ok');
  assert.deepEqual(restored.connection.prepare('PRAGMA foreign_key_check').all(),[]);
  assert.throws(()=>restored.connection.exec('UPDATE chapters SET id=22 WHERE id=1'));
  console.log('Recovery verified: isolated SQLite backup/restore preserves schema, chapters, ratings and Unicode comments.');
} finally {source?.close();restored?.close();await rm(directory,{recursive:true,force:true});}
