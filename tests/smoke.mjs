import http from 'node:http';
import { spawn } from 'node:child_process';

const mock = http.createServer(async (req,res)=>{
  let body=''; for await (const chunk of req) body+=chunk;
  const data=body?JSON.parse(body):{};
  let out={ok:true};
  if(data.action==='ping') out.message='mock';
  if(data.action==='list') out.items=[{id:'1',name:'Camisa blanca',category:'Camisas',color:'Blanco',description:'',frontImage:'https://example.com/camisa.jpg',status:'ACTIVO'}];
  if(data.action==='listLooks') out.looks=[];
  if(data.action==='createLook') out.look={id:'look-1',name:data.name,top:data.top||'',jacket:data.jacket||'',bottom:data.bottom||'',onePiece:data.onePiece||'',shoes:data.shoes||'',bag:data.bag||'',accessories:data.accessories||[],description:data.description||'',styling:data.styling||'',visual:'https://example.com/look.png',status:'ACTIVO'};
  res.writeHead(200,{'content-type':'application/json'});res.end(JSON.stringify(out));
});
await new Promise(r=>mock.listen(3999,r));
const child=spawn(process.execPath,['server.js'],{cwd:new URL('..',import.meta.url).pathname,env:{...process.env,PORT:'3998',GOOGLE_APPS_SCRIPT_URL:'http://127.0.0.1:3999',OPENAI_API_KEY:'test'}});
await new Promise(r=>setTimeout(r,1200));
const meta=await fetch('http://127.0.0.1:3998/api/meta').then(r=>r.json());
const items=await fetch('http://127.0.0.1:3998/api/items').then(r=>r.json());
const bad=await fetch('http://127.0.0.1:3998/api/looks',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({name:'Prueba',top:'NO_EXISTE',generatedImage:'abc'})}).then(r=>r.json());
if(!meta.ok || !items.ok || bad.ok || !/inexistentes/.test(bad.error)) throw new Error(JSON.stringify({meta,items,bad}));
console.log('SMOKE OK');
child.kill();mock.close();
