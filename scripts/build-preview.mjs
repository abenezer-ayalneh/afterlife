import { cp, mkdir, readFile, writeFile, rm, symlink } from 'node:fs/promises';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

// Build an isolated UI preview without Cloudflare services or live submissions.
const root = resolve('.');
const preview = resolve('.ui-preview');
await rm(preview, { recursive: true, force: true });
await mkdir(preview);
try {
  await cp('src', `${preview}/src`, { recursive: true });
  await cp('public', `${preview}/public`, { recursive: true });
  await symlink(`${root}/node_modules`, `${preview}/node_modules`, 'dir');
  await writeFile(`${preview}/package.json`, '{"type":"module"}');
  await writeFile(`${preview}/astro.config.mjs`, `import { defineConfig } from 'astro/config';\nexport default defineConfig({output:'static',outDir:${JSON.stringify(`${root}/dist`)},devToolbar:{enabled:false}});\n`);
  for (const path of ['src/middleware.ts', 'src/pages/api', 'src/pages/admin']) {
    await rm(`${preview}/${path}`, { recursive: true, force: true });
  }
  const items = Array.from({ length: 9 }, (_, i) => ({ id: i + 1, title: `Chapter ${i + 1}` }));
  await writeFile(`${preview}/src/lib/preview.ts`, `export const items=${JSON.stringify(items)};\n`);
  let home = await readFile(`${preview}/src/pages/index.astro`, 'utf8');
  home = home.replace("import {env} from 'cloudflare:workers';", '').replace("import {chapters} from '../lib/db';", "import {items} from '../lib/preview';").replace('const items=await chapters(env.DB);', '');
  await writeFile(`${preview}/src/pages/index.astro`, home);
  let chapter = await readFile(`${preview}/src/pages/chapters/[id].astro`, 'utf8');
  chapter = chapter.replace("import {env} from 'cloudflare:workers';", '').replace("import {chapter,chapters,comments,results,ownRating} from '../../lib/db';", "import {items} from '../../lib/preview';\nexport function getStaticPaths(){return items.map(item=>({params:{id:String(item.id)}}));}").replace("import {isLocal} from '../../lib/security';", '');
  const start = chapter.indexOf('const id=');
  const end = chapter.indexOf('\n---', start);
  chapter = chapter.slice(0, start) + `const id=integer(Astro.params.id,1,9,'This chapter could not be found.');\nconst item=items.find(item=>item.id===id)!;\nconst data={count:0,average:null,distribution:Array(11).fill(0)};\nconst rating=null;const list={items:[],next:null};const index=items;\nconst position=index.findIndex(row=>row.id===id);const previous=index[position-1];const next=index[position+1];const local=false;` + chapter.slice(end);
  await writeFile(`${preview}/src/pages/chapters/[id].astro`, chapter);
  await writeFile(`${preview}/src/components/Verification.astro`, '---\ninterface Props {action:string}\n---\n');
  await writeFile(`${preview}/src/scripts/reader.ts`, `document.querySelectorAll<HTMLFormElement>('form[data-action]').forEach(form=>form.addEventListener('submit',event=>{event.preventDefault();const status=form.querySelector<HTMLElement>('.form-status');if(status)status.textContent='UI preview only — ratings and comments are not saved.';}));\n`);
  const build = spawnSync(process.execPath, [`${root}/node_modules/astro/bin/astro.mjs`, 'build'], { cwd: preview, stdio: 'inherit' });
  if (build.status !== 0) throw new Error('UI preview build failed');
} finally {
  await rm(preview, { recursive: true, force: true });
}
