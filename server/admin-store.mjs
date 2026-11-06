import {get,head,put,BlobPreconditionFailedError,BlobNotFoundError} from '@vercel/blob';
import {initialState} from './admin-seed.mjs';
const file='private/restaurant-state-v1.json';
export function createBlobStore(){
 async function read(){const token=process.env.BLOB_READ_WRITE_TOKEN?.trim();let metadata;try{metadata=await head(file,{token})}catch(error){if(error instanceof BlobNotFoundError)return {data:initialState(),etag:null};throw error;}const result=await get(file,{token,access:'private',useCache:false});if(!result)throw new Error('Estado temporalmente no disponible');return {data:await new Response(result.stream).json(),etag:metadata.etag};}
 return {read:async()=> (await read()).data,async transaction(change){
  for(let attempt=0;attempt<5;attempt++){
   const {data,etag}=await read();const result=await change(data);
   try{await put(file,JSON.stringify(data),{token:process.env.BLOB_READ_WRITE_TOKEN?.trim(),access:'private',addRandomSuffix:false,allowOverwrite:!!etag,...(etag?{ifMatch:etag}:{}),contentType:'application/json',cacheControlMaxAge:60});return result}
   catch(error){if(!(error instanceof BlobPreconditionFailedError)&&!(!etag&&/already exists/i.test(error.message)))throw error;}
  }
  const error=new Error('Hay otro cambio en curso. Vuelve a intentarlo.');error.status=409;throw error;
 }};
}
export async function storeImage(bytes,type){const ext={'image/jpeg':'jpg','image/png':'png','image/webp':'webp'}[type];const id=crypto.randomUUID()+'.'+ext;await put('menu-images/'+id,bytes,{token:process.env.BLOB_READ_WRITE_TOKEN?.trim(),access:'private',addRandomSuffix:false,contentType:type});return '/api/app?action=media&id='+id;}
export async function readImage(id){if(!/^[a-f0-9-]{36}\.(jpg|png|webp)$/.test(id))return null;return get('menu-images/'+id,{token:process.env.BLOB_READ_WRITE_TOKEN?.trim(),access:'private'});}
