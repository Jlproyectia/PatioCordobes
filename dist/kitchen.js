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
 const stack=photo.parentElement;
 const cards=dishes.map((d,i)=>{
  const card=i===0?photo:new Image();card.src=`assets/images/${d[0]}.webp`;
  card.alt=tabs[i].textContent;card.classList.add('kitchen-card');card.style.zIndex=String(4-i);
  card.loading='eager';card.decoding='async';if(i)stack.append(card);return card;
 });
 stack.classList.add('kitchen-card-stack');
 let active=-1,scheduled=false;
 function text(el,es,en){el.dataset.es=es;el.dataset.en=en;el.textContent=document.documentElement.lang==='en'?en:es}
 function activate(index){
  if(index===active)return;active=index;const d=dishes[index];
  tabs.forEach((b,i)=>{b.setAttribute('aria-selected',String(i===index));b.tabIndex=i===index?0:-1});
  panel.setAttribute('aria-labelledby',tabs[index].id);
  text(title,d[1],d[2]);text(copy,d[3],d[4]);section.querySelector('.image-index').textContent=`0${index+1} / 04`;

 }
 function range(){return Math.max(1,section.offsetHeight-stage.offsetHeight)}
 function draw(position){
  const height=stack.clientHeight,front=Math.floor(position),fraction=position-front;
  cards.forEach((card,i)=>{
   const passed=i<front,fall=i===front?fraction:0,depth=Math.max(0,i-position);
   const y=passed?height+48:24-Math.min(depth,3)*8+fall*(height+48);
   const scale=1-Math.min(depth,3)*.035;
   card.style.transform=`translate3d(0,${y}px,0) scale(${scale})`;
   card.setAttribute('aria-hidden',String(i!==Math.min(3,Math.floor(position+.5))));
  });
  activate(Math.min(3,Math.floor(position+.5)));
 }
 function update(){scheduled=false;if(reduced.matches)return;const progress=Math.max(0,Math.min(1,-section.getBoundingClientRect().top/range()));draw(Math.max(0,Math.min(3,progress*3.6-.3)))}
 function select(index){
  draw(index);
  if(!reduced.matches){const top=scrollY+section.getBoundingClientRect().top;scrollTo({top:top+range()*((index+.3)/3.6),behavior:'instant'})}
 }
 tabs.forEach((b,i)=>{b.addEventListener('click',()=>select(i));b.addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End'].includes(e.key))return;e.preventDefault();const n=e.key==='Home'?0:e.key==='End'?3:(i+(['ArrowRight','ArrowDown'].includes(e.key)?1:3))%4;tabs[n].focus({preventScroll:true});select(n)})});
 function setup(){section.classList.toggle('kitchen-scroll',!reduced.matches);draw(active<0?0:active);update()}
 addEventListener('scroll',()=>{if(!scheduled){scheduled=true;requestAnimationFrame(update)}},{passive:true});addEventListener('resize',update);reduced.addEventListener('change',setup);setup();
})();
