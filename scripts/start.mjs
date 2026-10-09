import {validateConfig} from '../src/lib/config.mjs';
import {existsSync,readdirSync} from 'node:fs';
import {openDatabase} from '../src/lib/sqlite-core.mjs';
const config=validateConfig(process.env);
if(!existsSync(config.DATABASE_PATH))throw new Error('Run database migrations before starting the application.');
const db=openDatabase(config.DATABASE_PATH);
try {
  const applied=new Set(db.connection.prepare('SELECT name FROM schema_migrations').all().map(row=>row.name));
  if(readdirSync('migrations').filter(name=>/^\d+.*\.sql$/.test(name)).some(name=>!applied.has(name)))throw new Error('Run all database migrations before starting the application.');
  db.connection.prepare('SELECT id FROM chapters LIMIT 1').get();
  for(const email of config.ADMIN_EMAILS)if(!db.connection.prepare('SELECT email FROM admin_accounts WHERE email=?').get(email))throw new Error('Set a password for each approved administrator using scripts/admin-account.mjs before startup.');
} finally {db.close();}
await import('../dist/server/entry.mjs');
