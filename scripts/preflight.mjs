import {existsSync,readdirSync} from 'node:fs';
import {openDatabase} from '../src/lib/sqlite-core.mjs';
import {validateConfig} from '../src/lib/config.mjs';
const target=process.argv[2];
if(!['staging','production'].includes(target)) throw new Error('Choose staging or production.');
const config=validateConfig(process.env);
if(config.APP_ENV!==target) throw new Error('APP_ENV must match the target.');
if(process.argv.includes('--ready')) {
 if(!existsSync(config.DATABASE_PATH))throw new Error('Run migrations before readiness checks.');
 const db=openDatabase(config.DATABASE_PATH);
 try{
  const applied=new Set(db.connection.prepare('SELECT name FROM schema_migrations').all().map(row=>row.name));
  if(readdirSync('migrations').filter(name=>/^\d+.*\.sql$/.test(name)).some(name=>!applied.has(name)))throw new Error('Apply all migrations first.');
  for(const email of config.ADMIN_EMAILS)if(!db.connection.prepare('SELECT email FROM admin_accounts WHERE email=?').get(email))throw new Error('Set passwords for both approved administrators before deployment.');
 }finally{db.close();}
}
console.log(`${target} environment configuration validated. Verify migrations, Nginx, TLS and local administrator accounts before launch.`);
