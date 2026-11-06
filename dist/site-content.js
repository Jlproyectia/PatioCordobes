(() => {
  'use strict';
  const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])).replace(/\n/g,'<br>');
  const language=()=>document.documentElement.lang==='en'?'en':'es';
  const names={es:['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'],en:['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']};
  function hours(schedule){
    document.querySelectorAll('.hours-list').forEach(list=>{
      list.replaceChildren();
      for(const day of [1,2,3,4,5,6,0]){const row=schedule.days.find(d=>d.day===day);const block=document.createElement('div'),dt=document.createElement('dt'),dd=document.createElement('dd');dt.dataset.es=names.es[day];dt.dataset.en=names.en[day];dt.textContent=names[language()][day];
        if(row.closed){block.className='hours-closed';dd.dataset.es='Cerrado';dd.dataset.en='Closed';dd.textContent=language()==='en'?'Closed':'Cerrado';}else row.slots.forEach(slot=>{const span=document.createElement('span');span.className='hours-slot';span.textContent=slot.start+' – '+slot.end;dd.append(span);});block.append(dt,dd);list.append(block);
      }
    });
  }
  function apply(site){
    window.patioSite=site;
    for(const [id,entry] of Object.entries(site.content||{})){
      if(entry.reset)continue;
      document.querySelectorAll('[data-content-text="'+CSS.escape(id)+'"]').forEach(el=>{el.dataset.es=escape(entry.value);el.dataset.en=escape(entry.en??entry.value);el.innerHTML=el.dataset[language()];});
      document.querySelectorAll('[data-content-image="'+CSS.escape(id)+'"]').forEach(el=>{el.src=entry.value;el.alt=entry.alt||el.alt;el.removeAttribute('srcset');if(el.classList.contains('film-poster'))el.parentElement.querySelector('video')?.setAttribute('poster',entry.value);});
      document.querySelectorAll('[data-content-link="'+CSS.escape(id)+'"]').forEach(el=>{el.href=entry.value;});
      document.querySelectorAll('[data-content-video="'+CSS.escape(id)+'"]').forEach(source=>{source.dataset.src=entry.value;if(source.hasAttribute('src')){source.src=entry.value;source.parentElement.load();}});
      if(id==='site-logo')document.querySelector('link[rel="icon"]')?.setAttribute('href',entry.value);
    }
    if(site.schedule)hours(site.schedule);
    window.dispatchEvent(new CustomEvent('sitecontent',{detail:site}));
  }
  const domReady=new Promise(resolve=>{if(document.readyState==='complete')resolve();else document.addEventListener('DOMContentLoaded',resolve,{once:true});});
  window.patioSiteReady=fetch('/api/app?action=site',{cache:'no-store'}).then(r=>{if(!r.ok)throw Error('Content unavailable');return r.json();}).then(async site=>{await domReady;apply(site);return site;}).catch(()=>null);
  if(new URLSearchParams(location.search).get('editor')==='1'&&window.parent!==window){
    document.documentElement.classList.add('content-preview');
    document.addEventListener('click',event=>{const el=event.target.closest('[data-content-image],[data-content-text],[data-content-link]');event.preventDefault();event.stopImmediatePropagation();if(el){const id=el.dataset.contentImage||el.dataset.contentText||el.dataset.contentLink;window.parent.postMessage({type:'patio-edit',id},location.origin);}},true);
  }
})();
