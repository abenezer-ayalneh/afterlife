import {validateConfig} from '../src/lib/config.mjs';
const target=process.argv[2];
if(!['staging','production'].includes(target)) throw new Error('Choose staging or production.');
const config=validateConfig(process.env);
if(config.APP_ENV!==target) throw new Error('APP_ENV must match the target.');
console.log(`${target} environment configuration validated. Verify migrations, Nginx, TLS, Access and Turnstile before launch.`);
