import {scrypt,randomBytes,timingSafeEqual} from 'node:crypto';
import {promisify} from 'node:util';
const derive=promisify(scrypt);
const options={N:65536,r:8,p:2,maxmem:96*1024*1024};
export async function passwordHash(password) {
  if(typeof password!=='string' || password.length<12 || Buffer.byteLength(password)>128)throw new Error('Use a password of at least 12 characters and at most 128 UTF-8 bytes.');
  const salt=randomBytes(16).toString('hex');
  const hash=await derive(password,salt,32,options);
  return `scrypt$65536$8$2$${salt}$${hash.toString('hex')}`;
}
// Valid dummy record ensures unknown accounts also pay the password-hash cost.
export const dummyHash='scrypt$65536$8$2$'+'0'.repeat(32)+'$'+'0'.repeat(64);
export async function passwordMatches(password,record) {
  if(typeof password!=='string' || Buffer.byteLength(password)>128)return false;
  const parts=record.split('$');
  if(parts.length!==6 || parts.slice(0,4).join('$')!=='scrypt$65536$8$2' || !/^[a-f\d]{32}$/.test(parts[4]) || !/^[a-f\d]{64}$/.test(parts[5]))return false;
  const hash=await derive(password,parts[4],32,options);
  return timingSafeEqual(hash,Buffer.from(parts[5],'hex'));
}
