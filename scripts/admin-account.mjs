import {existsSync} from 'node:fs';
import {createInterface} from 'node:readline/promises';
import {Writable} from 'node:stream';
import {validateConfig} from '../src/lib/config.mjs';
import {openDatabase} from '../src/lib/sqlite-core.mjs';
import {passwordHash} from '../src/lib/passwords.mjs';
const email=process.argv[2]?.trim().toLowerCase();
const config=validateConfig(process.env,{allowLocal:process.env.APP_ENV==='local'});
if(!email || !config.ADMIN_EMAILS.includes(email))throw new Error('Supply an approved administrator email.');
if(!existsSync(config.DATABASE_PATH))throw new Error('Run migrations first.');
if(!process.stdin.isTTY)throw new Error('Run interactively to enter the password privately. Password arguments are not accepted.');
const muted=new Writable({write(_chunk,_encoding,callback){callback();}});
const prompt=createInterface({input:process.stdin,output:muted,terminal:true});
let password,confirmation;
try {
 process.stdout.write('New password (12+ characters; hidden): ');password=await prompt.question('');
 process.stdout.write('\nConfirm password (hidden): ');confirmation=await prompt.question('');
 process.stdout.write('\n');
}finally{prompt.close();}
if(password!==confirmation)throw new Error('Passwords did not match.');
const encoded=await passwordHash(password);const db=openDatabase(config.DATABASE_PATH);
try {
 await db.batch([
  db.prepare('INSERT INTO admin_accounts(email,password_hash) VALUES(?,?) ON CONFLICT(email) DO UPDATE SET password_hash=excluded.password_hash,updated_at=CURRENT_TIMESTAMP').bind(email,encoded),
  db.prepare('DELETE FROM admin_sessions WHERE email=?').bind(email),
 ]);
 console.log('Administrator password saved; previous sessions revoked.');
}finally{db.close();}
