import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { openDatabase, migrate } from '../src/lib/sqlite-core.mjs';
const [command,argument,destination]=process.argv.slice(2);
const filename=argument || process.env.DATABASE_PATH;
if(!filename) throw new Error('Supply a database path or DATABASE_PATH.');
if(!['migrate','backup','check'].includes(command)) throw new Error('Use migrate, backup or check.');
if(command!=='migrate' && !existsSync(filename)) throw new Error('Source database does not exist.');
const db=openDatabase(filename);
try {
  if(command==='migrate') migrate(db);
  if(command==='backup') {
    if(!destination || existsSync(destination) || resolve(filename)===resolve(destination)) throw new Error('Supply a new backup destination.');
    await db.backup(destination);
  }
  if(command==='check') {
    const result=db.connection.prepare('PRAGMA integrity_check').get();
    if(result.integrity_check!=='ok' || db.connection.prepare('PRAGMA foreign_key_check').all().length) throw new Error('Database integrity check failed.');
    if(db.connection.prepare('SELECT COUNT(*) AS count FROM chapters').get().count<9) throw new Error('Missing chapters.');
  }
  console.log(`${command} completed.`);
} finally {db.close();}
