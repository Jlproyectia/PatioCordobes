import {createBlobStore,storeImage,readImage} from '../server/admin-store.mjs';
import {createAdminService} from '../server/admin-service.mjs';
const handle=createAdminService({store:createBlobStore(),env:process.env,uploadImage:storeImage,fetchImage:readImage});
export default async function handler(req,res){
 try{
  const chunks=[];let size=0;if(req.body!==undefined){const parsed=Buffer.isBuffer(req.body)?req.body:Buffer.from(typeof req.body==='string'?req.body:JSON.stringify(req.body));chunks.push(parsed);size=parsed.length;}else for await(const chunk of req){size+=chunk.length;if(size>3000000){res.statusCode=413;res.end('Request too large');return}chunks.push(chunk)}
  if(size>3000000){res.statusCode=413;res.end('Request too large');return}
  const base=process.env.APP_ORIGIN?.trim()||'https://patiocordobes.vercel.app';
  const request=new Request(new URL(req.url,base),{method:req.method,headers:req.headers,...(['GET','HEAD'].includes(req.method)?{}:{body:Buffer.concat(chunks)})});
  const response=await handle(request);res.statusCode=response.status;for(const [k,v] of response.headers)res.setHeader(k,v);res.end(Buffer.from(await response.arrayBuffer()));
 }catch{res.statusCode=503;res.setHeader('Content-Type','application/json');res.end(JSON.stringify({error:'Servicio temporalmente no disponible.'}))}
}
