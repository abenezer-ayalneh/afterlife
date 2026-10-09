import {request} from 'node:http';
const origin=new URL(process.env.PUBLIC_ORIGIN);
await new Promise((resolve,reject)=>{
  const req=request({hostname:'127.0.0.1',port:process.env.PORT||4321,path:'/health',headers:{Host:origin.host,'X-Forwarded-Host':origin.host,'X-Forwarded-Proto':'https','X-Forwarded-Port':origin.port||'443'},signal:AbortSignal.timeout(4000)},response=>{
    let body='';response.on('data',chunk=>body+=chunk);response.on('end',()=>{
      try{if(response.statusCode!==200 || JSON.parse(body).status!=='ok')throw new Error('Health check failed');resolve();}catch(error){reject(error);}
    });
  });req.on('error',reject);req.end();
});
