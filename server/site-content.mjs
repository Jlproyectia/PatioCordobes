import fields from './site-manifest.json' with {type:'json'};
import {categories} from './admin-seed.mjs';
import {scheduleOf,validateSchedule} from './site-settings.mjs';
const fail=(status,message)=>{const e=new Error(message);e.status=status;throw e;};
const string=(v,max)=>{if(typeof v!=='string'||v.length>max)fail(400,'Contenido no válido o demasiado largo.');return v.trim();};
export const publicSite = s => ({content:s.content||{},categories:s.categories||categories,schedule:scheduleOf(s)});
export const privateSite = s => ({...publicSite(s),fields});
function media(value,type){
  if(/^assets\/(images|videos)\/[a-zA-Z0-9_-]+\.(webp|jpg|png|mp4)$/.test(value))return value;
  if(type==='image'&&/^\/api\/app\?action=media&id=[a-f0-9-]{36}\.(jpg|png|webp)$/.test(value))return value;
  if(type==='video'){try{const url=new URL(value);if(url.protocol==='https:'&&!url.username&&!url.password&&url.pathname.endsWith('.mp4'))return value;}catch{}}
  fail(400,type==='image'?'Sube una imagen JPG, PNG o WebP.':'Introduce un enlace HTTPS directo a un vídeo MP4.');
}
function link(value){if(/^(?:#[a-zA-Z0-9_-]+|(?:index|carta|celebraciones|galeria|informacion)\.html(?:#[a-zA-Z0-9_-]+)?)$/.test(value))return value;try{const u=new URL(value);if(['https:','http:','tel:','mailto:'].includes(u.protocol)&&!u.username&&!u.password)return value;}catch{}fail(400,'Enlace no válido. Usa una página de la web, HTTPS, teléfono o correo.');}
export async function saveSite(store,action,data){
  if(action==='content'){
    const field=fields.find(f=>f.id===data.id);if(!field)fail(404,'Contenido no encontrado.');
    let value={reset:data.reset===true};
    if(!value.reset){value.value=string(data.value,field.type==='text'?5000:1000);if(field.type==='text')value.en=string(data.en??data.value,5000);if(field.type==='image'||field.type==='video')value.value=media(value.value,field.type);if(field.type==='link')value.value=link(value.value);if(field.type==='image')value.alt=string(data.alt||'',240);}
    return store.transaction(s=>{s.content??={};const old=s.content[field.id];if((old?.version||0)!==data.version)fail(409,'Este contenido ha cambiado. Actualiza antes de guardar.');s.content[field.id]={...value,version:(old?.version||0)+1};return s.content[field.id];});
  }
  if(action==='category'){
    const es=string(data.es,100),en=string(data.en||data.es,100);if(!es)fail(400,'Escribe el nombre de la categoría.');
    return store.transaction(s=>{s.categories??=structuredClone(categories);const row=s.categories.find(c=>c.id===data.id);if(!row)fail(404,'Categoría no encontrada.');if((row.version||1)!==data.version)fail(409,'La categoría ha cambiado. Actualiza antes de guardar.');Object.assign(row,{es,en,version:(row.version||1)+1});return row;});
  }
  if(action==='schedule'){
    const valid=validateSchedule(data);return store.transaction(s=>{if(scheduleOf(s).version!==data.version)fail(409,'El horario ha cambiado. Actualiza antes de guardar.');s.schedule={...valid,version:data.version+1};return s.schedule;});
  }
  fail(404,'Acción no encontrada.');
}
