import {existsSync} from 'node:fs';
import {mkdtemp,cp,rm,mkdir} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve,dirname} from 'node:path';
import {spawnSync} from 'node:child_process';
const destination=process.argv[2];
if(!destination || existsSync(destination))throw new Error('Supply a new archive destination.');
if(!existsSync('dist/server/entry.mjs'))throw new Error('Build the Node release first.');
const temporary=await mkdtemp(join(tmpdir(),'afterlife-release-'));
try {
  for(const file of ['dist','package.json','package-lock.json','migrations','src/lib/config.mjs','src/lib/sqlite-core.mjs','scripts/database.mjs','scripts/preflight.mjs','scripts/start.mjs','scripts/healthcheck.mjs','deploy']) {
    const target=join(temporary,file);await mkdir(dirname(target),{recursive:true});await cp(file,target,{recursive:true,filter:path=>!path.endsWith('/.DS_Store')});
  }
  const result=spawnSync('tar',['-czf',resolve(destination),'-C',temporary,'.'],{stdio:'inherit'});
  if(result.status!==0)throw new Error('Release archive failed.');
  console.log('Native release archived. Install production dependencies on the Ubuntu target.');
}finally{await rm(temporary,{recursive:true,force:true});}
