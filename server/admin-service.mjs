import {createHmac,randomBytes,scryptSync,timingSafeEqual,randomUUID} from 'node:crypto';
import {categories} from './admin-seed.mjs';
const fail=(status,message)=>{const e=new Error(message);e.status=status;throw e};
const hash=(secret,text)=>createHmac('sha256',secret).update(text).digest('hex');
const equal=(a,b)=>{const x=Buffer.from(a),y=Buffer.from(b);return x.length===y.length&&timingSafeEqual(x,y)};
const nowDate=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Madrid',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
const text=(value,max,required=false)=>{if(typeof value!=='string'||value.length>max||(required&&!value.trim()))fail(400,'Revisa los campos del formulario.');return value.trim()};
export function validateDate(date){if(typeof date!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(date))fail(400,'Fecha no válida.');const d=new Date(date+'T12:00:00Z');if(!Number.isFinite(+d)||d.toISOString().slice(0,10)!==date||date<nowDate()||+d>Date.now()+366*86400000)fail(400,'La fecha debe estar dentro del próximo año.');if([1,2,3].includes(d.getUTCDay()))fail(400,'El restaurante cierra de lunes a miércoles.');return date;}
function reservation(data){const name=text(data.name,100,true),email=text(data.email,254,true).toLowerCase(),date=validateDate(data.date);if(!/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(email)||!Number.isInteger(data.guests)||data.guests<1||data.guests>30||!['comida','cena'].includes(data.service))fail(400,'Revisa el correo, las personas y el servicio.');return {name,email,date,guests:data.guests,service:data.service,language:data.language==='en'?'en':'es'};}
function product(data){const name=text(data.name,120,true),nameEn=text(data.nameEn||'',120),description=text(data.description||'',600),descriptionEn=text(data.descriptionEn||'',600);if(!categories.some(c=>c.id===data.category)||!(data.price===null||(typeof data.price==='number'&&Number.isFinite(data.price)&&data.price>=0&&data.price<=10000))||!['portion','100g'].includes(data.unit)||typeof data.active!=='boolean')fail(400,'Revisa categoría, precio y disponibilidad.');const image=text(data.image,240,true);if(!/^assets\/images\/[a-zA-Z0-9_-]+\.(webp|jpg|png)$/.test(image)&&!/^\/api\/app\?action=media&id=[a-f0-9-]{36}\.(jpg|png|webp)$/.test(image))fail(400,'Imagen no válida.');return {name,nameEn,description,descriptionEn,category:data.category,price:data.price===null?null:Math.round(data.price*100)/100,unit:data.unit,active:data.active,image};}
function rate(state,key,limit,period){const now=Date.now();for(const [k,v] of Object.entries(state.limits)){if(v.until<=now)delete state.limits[k]}const entry=state.limits[key]||{count:0,until:now+period};if(entry.count>=limit)return false;entry.count++;state.limits[key]=entry;return true;}
function audit(state,action,id){state.audit.push({at:new Date().toISOString(),action,id});state.audit=state.audit.slice(-500);}
export function createAdminService({store,env,uploadImage,fetchImage}){
 const secret=env.ADMIN_SESSION_SECRET?.trim(),pinHash=env.ADMIN_PIN_HASH?.trim(),origin=env.APP_ORIGIN?.trim();
 const json=(data,status=200,headers={})=>Response.json(data,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff',...headers}});
 const cookie=(value,age)=>`patio_admin=${value}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${age}${origin?.startsWith('https:')?'; Secure':''}`;
 function session(request){const value=request.headers.get('cookie')?.match(/(?:^|;\s*)patio_admin=([^;]+)/)?.[1];if(!value)return null;const [payload,signature]=value.split('.');if(!payload||!signature||!equal(hash(secret,payload),signature))return null;try{const data=JSON.parse(Buffer.from(payload,'base64url').toString());return data.exp>Date.now()&&typeof data.csrf==='string'?data:null}catch{return null}}
 async function body(request,max=100000){if(!request.headers.get('content-type')?.includes('application/json'))fail(415,'Formato no permitido.');const raw=await request.text();if(raw.length>max)fail(413,'Solicitud demasiado grande.');try{return JSON.parse(raw)}catch{fail(400,'Solicitud no válida.')}}
 return async function handle(request){try{
  if(!secret||!pinHash||!origin)fail(503,'Administración pendiente de configuración.');
  const url=new URL(request.url),action=url.searchParams.get('action')||'',method=request.method;
  if(!['GET','POST','PUT'].includes(method))fail(405,'Método no permitido.');
  if(method!=='GET'&&request.headers.get('origin')!==origin)fail(403,'Origen no permitido.');
  const ip=hash(secret,request.headers.get('x-real-ip')||'unknown');
  if(action==='menu'&&method==='GET'){const state=await store.read();return json({categories,products:state.products.filter(p=>p.active)});}
  if(action==='media'&&method==='GET'){const result=await fetchImage(url.searchParams.get('id')||'');if(!result)fail(404,'Imagen no encontrada.');return new Response(result.stream,{headers:{'Content-Type':result.blob.contentType,'Cache-Control':'public, max-age=31536000, immutable','X-Content-Type-Options':'nosniff'}});}
  if(action==='login'&&method==='POST'){
   const data=await body(request,200);const allowed=await store.transaction(s=>rate(s,'login:'+ip,5,15*60000)&&rate(s,'login-global',30,15*60000));if(!allowed)return json({error:'Demasiados intentos. Espera 15 minutos.'},429,{'Retry-After':'900'});
   const [salt,expected]=pinHash.split(':');const valid=typeof data.pin==='string'&&/^\d{4,12}$/.test(data.pin)&&equal(scryptSync(data.pin,salt,64).toString('hex'),expected);
   if(!valid)fail(401,'PIN incorrecto.');
   const dataSession={exp:Date.now()+8*3600000,csrf:randomBytes(32).toString('hex')};const payload=Buffer.from(JSON.stringify(dataSession)).toString('base64url');return json({ok:true,csrf:dataSession.csrf},200,{'Set-Cookie':cookie(payload+'.'+hash(secret,payload),8*3600)});
  }
  if(action==='bookings'&&method==='POST'){
   const data=await body(request,4096);if(data.website)fail(400,'Solicitud no válida.');const valid=reservation(data);if(typeof data.requestId!=='string'||!/^[-a-f0-9]{36}$/.test(data.requestId))fail(400,'Identificador no válido.');
   const result=await store.transaction(s=>{const existing=s.bookings.find(b=>b.id===data.requestId);if(existing){if(['name','email','date','guests','service'].some(k=>existing[k]!==valid[k]))return {conflict:true};return {ok:true}}
    if(!rate(s,'booking:'+ip,10,3600000)||!rate(s,'email:'+hash(secret,valid.email),3,3600000))return {limited:true};
    s.bookings.push({...valid,id:data.requestId,status:'pending',version:1,createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()});audit(s,'booking-created',data.requestId);return {ok:true}});
   if(result.conflict)fail(409,'La solicitud ha cambiado. Vuelve a intentarlo.');if(result.limited)fail(429,'Has enviado varias solicitudes. Vuelve a intentarlo más tarde.');return json({ok:true,status:'pending',notificationSent:false});
  }
  const admin=session(request);if(!admin)fail(401,'Inicia sesión para continuar.');
  if(method!=='GET'&&!equal(request.headers.get('x-csrf-token')||'',admin.csrf))fail(403,'Sesión no válida. Vuelve a entrar.');
  if(action==='session'&&method==='GET')return json({ok:true,csrf:admin.csrf});
  if(action==='logout'&&method==='POST')return json({ok:true},200,{'Set-Cookie':cookie('',0)});
  if(action==='admin-data'&&method==='GET'){const s=await store.read();return json({categories,products:s.products,bookings:s.bookings.slice().sort((a,b)=>b.createdAt.localeCompare(a.createdAt))});}
  if(action==='product'&&['POST','PUT'].includes(method)){
   const data=await body(request),valid=product(data);const id=method==='POST'?randomUUID():text(data.id,60,true);
   const result=await store.transaction(s=>{const existing=s.products.find(p=>p.id===id);if(method==='PUT'&&!existing)fail(404,'Plato no encontrado.');if(existing&&existing.version!==data.version)fail(409,'Este plato ha cambiado. Recarga antes de editar.');const updated={...valid,id,order:existing?.order??s.products.length,version:(existing?.version||0)+1};if(existing)Object.assign(existing,updated);else s.products.push(updated);audit(s,existing?'product-updated':'product-created',id);return updated});return json({ok:true,product:result});
  }
  if(action==='reservation'&&method==='PUT'){
   const data=await body(request,4096);const result=await store.transaction(s=>{const b=s.bookings.find(x=>x.id===data.id);if(!b)fail(404,'Reserva no encontrada.');if(b.version!==data.version)fail(409,'Esta reserva ha cambiado. Recarga antes de editar.');if(!['pending','confirmed','cancelled'].includes(data.status))fail(400,'Estado no válido.');let valid={};if(data.status!=='cancelled')valid=reservation({...b,date:data.date,guests:data.guests,service:data.service});Object.assign(b,valid,{status:data.status,version:b.version+1,updatedAt:new Date().toISOString()});audit(s,'reservation-'+data.status,b.id);return b});return json({ok:true,booking:result,notificationSent:false});
  }
  if(action==='upload'&&method==='POST'){
   const data=await body(request,2900000);if(!['image/jpeg','image/png','image/webp'].includes(data.type)||typeof data.data!=='string'||data.data.length>2800000)fail(400,'Usa una imagen JPG, PNG o WebP de hasta 2 MB.');const bytes=Buffer.from(data.data,'base64');if(bytes.length>2*1024*1024||bytes.length<12)fail(400,'Imagen demasiado grande o vacía.');const type=bytes[0]===255&&bytes[1]===216?'image/jpeg':bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))?'image/png':bytes.toString('ascii',0,4)==='RIFF'&&bytes.toString('ascii',8,12)==='WEBP'?'image/webp':null;if(type!==data.type)fail(400,'El archivo no es una imagen válida.');const allowed=await store.transaction(s=>rate(s,'upload:'+ip,30,3600000));if(!allowed)fail(429,'Límite de imágenes alcanzado. Inténtalo más tarde.');return json({ok:true,image:await uploadImage(bytes,type)});
  }
  fail(404,'Recurso no encontrado.');
 }catch(error){return json({error:error.status?error.message:'No se pudo guardar. Inténtalo de nuevo.'},error.status||503)}};
}
