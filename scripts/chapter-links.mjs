import { bookChapters } from './chapters.mjs';
const origin=process.argv[2];if(!origin)throw new Error('Provide the approved public HTTPS origin.');const url=new URL(origin);if(url.protocol!=='https:'||url.origin!==origin)throw new Error('Use an HTTPS origin with no path or trailing slash.');
for(const {id,title} of bookChapters)console.log(`${id}. ${title}: ${origin}/chapters/${id}`);
