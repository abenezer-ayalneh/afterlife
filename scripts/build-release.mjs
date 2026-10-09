import {spawnSync} from 'node:child_process';
// Build only needs the intended canonical origin. Actual secrets are runtime-only.
const target=process.argv[2];
if(!['staging','production'].includes(target))throw new Error('Choose staging or production.');
const origin=target==='staging'?'https://afterlife.abenezer-ayalneh.dev':process.env.PUBLIC_ORIGIN;
if(!origin || new URL(origin).origin!==origin || !origin.startsWith('https://'))throw new Error('Set canonical HTTPS PUBLIC_ORIGIN.');
if(target==='production' && origin==='https://afterlife.abenezer-ayalneh.dev')throw new Error('Choose the final production domain.');
const build=spawnSync(process.execPath,['node_modules/astro/bin/astro.mjs','build'],{stdio:'inherit',env:{...process.env,APP_ENV:target,PUBLIC_ORIGIN:origin}});
if(build.status!==0)process.exit(build.status||1);
