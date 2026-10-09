const origin=process.argv[2];if(!origin)throw new Error('Provide the approved public HTTPS origin.');const url=new URL(origin);if(url.protocol!=='https:'||url.origin!==origin)throw new Error('Use an HTTPS origin with no path or trailing slash.');
for(let id=1;id<=9;id++)console.log(`Chapter ${id}: ${origin}/chapters/${id}`);
