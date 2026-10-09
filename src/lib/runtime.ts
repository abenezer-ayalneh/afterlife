import { validateConfig } from './config.mjs';
import { openDatabase, type Database } from './sqlite';
export interface Runtime {
  DB:Database; APP_ENV:string; PUBLIC_ORIGIN:string; ADMIN_EMAILS:string[];
  TURNSTILE_SITE_KEY:string; TURNSTILE_SECRET_KEY?:string; RATE_LIMIT_SALT?:string;
  ACCESS_TEAM_DOMAIN:string; ACCESS_AUD:string;
}
let runtime:Runtime | undefined;
export function getRuntime():Runtime {
  if(!runtime) {
    const config=validateConfig({...import.meta.env,...process.env},{allowLocal:!!import.meta.env.DEV});
    const DB=openDatabase(config.DATABASE_PATH);
    runtime={...config,DB};
  }
  return runtime;
}
// Lazy access prevents builds and the isolated static preview opening a database.
export const env=new Proxy({} as Runtime,{get:(_target,key)=>getRuntime()[key as keyof Runtime]});
