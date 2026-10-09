import { isAbsolute } from 'node:path';
export const stagingOrigin='https://afterlife.abenezer-ayalneh.dev';
export function validateConfig(input, {allowLocal=false}={}) {
  const APP_ENV=input.APP_ENV || (allowLocal ? 'local' : '');
  if(!['local','staging','production'].includes(APP_ENV) || (APP_ENV==='local' && !allowLocal)) throw new Error('APP_ENV must be staging or production (local is development only).');
  const local=APP_ENV==='local';
  const value=key=>input[key] || '';
  const PUBLIC_ORIGIN=value('PUBLIC_ORIGIN') || (local?'http://localhost:4321':'');
  const origin=new URL(PUBLIC_ORIGIN);
  if(origin.origin!==PUBLIC_ORIGIN || origin.username || origin.password || (!local && origin.protocol!=='https:')) throw new Error('PUBLIC_ORIGIN must be a canonical HTTPS origin without a path.');
  if(local && !['localhost','127.0.0.1','[::1]'].includes(origin.hostname)) throw new Error('Local origin must be loopback.');
  if(APP_ENV==='staging' && PUBLIC_ORIGIN!==stagingOrigin) throw new Error('Staging must use the approved temporary hostname.');
  if(APP_ENV==='production' && PUBLIC_ORIGIN===stagingOrigin) throw new Error('The temporary hostname is reserved for staging.');
  const DATABASE_PATH=value('DATABASE_PATH') || (local?'.data/local.sqlite':'');
  if(!DATABASE_PATH || (!local && !isAbsolute(DATABASE_PATH))) throw new Error('DATABASE_PATH must be an absolute persistent SQLite path.');
  const ADMIN_EMAILS=(value('ADMIN_EMAILS') || (local?'abenezer.ayalneh.42@gmail.com,boersarama@gmail.com':'')).split(',').map(email=>email.trim().toLowerCase()).filter(Boolean);
  if(ADMIN_EMAILS.some(email=>!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) || (!local && !ADMIN_EMAILS.length)) throw new Error('ADMIN_EMAILS must contain comma-separated valid email addresses.');
  const config={APP_ENV,PUBLIC_ORIGIN,DATABASE_PATH,ADMIN_EMAILS,RATE_LIMIT_SALT:value('RATE_LIMIT_SALT') || (local?'local-development-only-change-for-deployment':'')};
  if(!local) {
    for(const key of ['RATE_LIMIT_SALT']) if(!config[key]) throw new Error(`Missing ${key}`);
    if(config.RATE_LIMIT_SALT.length<32) throw new Error('RATE_LIMIT_SALT requires at least 32 characters.');
    if(!['abenezer.ayalneh.42@gmail.com','boersarama@gmail.com'].every(email=>ADMIN_EMAILS.includes(email)) || ADMIN_EMAILS.length!==2) throw new Error('Configure exactly the two approved administrators.');
    if(!DATABASE_PATH.endsWith(`/${APP_ENV}.sqlite`)) throw new Error('Use a separate staging.sqlite or production.sqlite database.');
  }
  return config;
}
