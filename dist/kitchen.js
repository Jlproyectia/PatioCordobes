(()=>{
 const section=document.querySelector('.kitchen');if(!section)return;
 const stage=section.querySelector('.kitchen-stage'),tabs=[...section.querySelectorAll('[data-speciality]')];
 const photo=section.querySelector('.dish-showcase-image img'),title=section.querySelector('.speciality-title'),copy=section.querySelector('#speciality-copy'),panel=section.querySelector('#speciality-panel');
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const dishes=[
  ['chuleton-servido','Carnes a la parrilla.','Meat from the grill.','En su punto y al centro de la mesa. Porque lo bueno sabe mejor cuando se comparte.','Cooked just right, for the centre of the table. Good food tastes better shared.'],
  ['pulpo-plato','Del mar a nuestra parrilla.','From the sea to our grill.','Pulpo, calamar y langostinos, con el sabor mediterráneo que nos gusta.','Octopus, squid and prawns, with the Mediterranean flavours we love.'],
  ['provolone-horno','Lo bueno se comparte.','Good food is for sharing.','Algo al centro, un poco para cada uno. Quesos, ensaladillas y el sabor de nuestra cocina de siempre.','Something for the table and a little for everyone. Cheese, salads and the flavours of home cooking.'],
  ['tarta-queso-nueva','Un final para quedarse.','A sweet reason to stay.','Nuestra tarta de queso al horno de leña. El comienzo de una buena sobremesa.','Our wood-fired cheesecake. The start of a lovely after-lunch conversation.']
 ];
 const images=dishes.map(d=>{const i=new Image();i.src=`assets/images/${d[0]}.webp`;return i});
 let active=-1,version=0,scheduled=false;
 function text(el,es,en){el.dataset.es=es;el.dataset.en=en;el.textContent=document.documentElement.lang==='en'?en:es}
 async function activate(index){
  if(index===active)return;active=index;const request=++version,d=dishes[index];
  tabs.forEach((b,i)=>{b.setAttribute('aria-selected',String(i===index));b.tabIndex=i===index?0:-1});
  panel.setAttribute('aria-labelledby',tabs[index].id);
  text(title,d[1],d[2]);text(copy,d[3],d[4]);section.querySelector('.image-index').textContent=`0${index+1} / 04`;
  try{await images[index].decode()}catch{}
  if(request!==version)return;photo.getAnimations().forEach(a=>a.cancel());photo.src=images[index].src;photo.alt=tabs[index].textContent;
  if(!reduced.matches)photo.animate([{opacity:.45,transform:'translateY(12px) scale(1.015)'},{opacity:1,transform:'translateY(0) scale(1)'}],{duration:450,easing:'cubic-bezier(.2,.7,.2,1)'});
 }
 function range(){return Math.max(1,section.offsetHeight-stage.offsetHeight)}
 function update(){scheduled=false;if(reduced.matches)return;const progress=Math.max(0,Math.min(1,-section.getBoundingClientRect().top/range()));activate(Math.min(3,Math.floor(progress*4)))}
 function select(index){
  activate(index);
  if(!reduced.matches){const top=scrollY+section.getBoundingClientRect().top;scrollTo({top:top+range()*((index+.5)/4),behavior:'instant'})}
 }
 tabs.forEach((b,i)=>{b.addEventListener('click',()=>select(i));b.addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End'].includes(e.key))return;e.preventDefault();const n=e.key==='Home'?0:e.key==='End'?3:(i+(['ArrowRight','ArrowDown'].includes(e.key)?1:3))%4;tabs[n].focus({preventScroll:true});select(n)})});
 function setup(){section.classList.toggle('kitchen-scroll',!reduced.matches);activate(active<0?0:active);update()}
 addEventListener('scroll',()=>{if(!scheduled){scheduled=true;requestAnimationFrame(update)}},{passive:true});addEventListener('resize',update);reduced.addEventListener('change',setup);setup();
})();
