(()=>{
  const gallery=document.querySelector('.organized-gallery');if(!gallery)return;
  const track=gallery.querySelector('.organized-grid'),items=[...track.children];
  const tabs=[...gallery.querySelectorAll('[data-patio-category]')];
  const controls=gallery.querySelector('.patio-gallery-controls'),categories=gallery.querySelector('.patio-gallery-categories');
  const previous=gallery.querySelector('.patio-gallery-prev'),next=gallery.querySelector('.patio-gallery-next'),counter=gallery.querySelector('.patio-gallery-count');
  const mobile=matchMedia('(max-width:760px)'),reduced=matchMedia('(prefers-reduced-motion:reduce)');
  let category=0,index=0,frame=0;
  const visible=()=>items.filter(item=>!item.hidden);
  function update(){
    frame=0;const slides=visible();if(!mobile.matches)return;
    const left=track.getBoundingClientRect().left;
    index=slides.reduce((best,item,i)=>Math.abs(item.getBoundingClientRect().left-left)<Math.abs(slides[best].getBoundingClientRect().left-left)?i:best,0);
    counter.textContent=`${index+1} / ${slides.length}`;previous.disabled=index===0;next.disabled=index===slides.length-1;
  }
  function select(value){
    category=value;index=0;
    items.forEach((item,i)=>item.hidden=mobile.matches&&Math.floor(i/4)!==category);
    tabs.forEach((tab,i)=>tab.setAttribute('aria-pressed',String(i===category)));
    track.scrollTo({left:0,behavior:'instant'});update();
  }
  function move(direction){
    const slides=visible(),target=slides[Math.max(0,Math.min(slides.length-1,index+direction))];
    track.scrollTo({left:track.scrollLeft+target.getBoundingClientRect().left-track.getBoundingClientRect().left,behavior:reduced.matches?'instant':'smooth'});
  }
  tabs.forEach(tab=>tab.addEventListener('click',()=>select(Number(tab.dataset.patioCategory))));
  previous.addEventListener('click',()=>move(-1));next.addEventListener('click',()=>move(1));
  track.addEventListener('keydown',event=>{if(mobile.matches&&['ArrowLeft','ArrowRight'].includes(event.key)){event.preventDefault();move(event.key==='ArrowRight'?1:-1)}});
  track.addEventListener('scroll',()=>{if(!frame)frame=requestAnimationFrame(update)},{passive:true});
  function layout(){categories.hidden=controls.hidden=!mobile.matches;track.tabIndex=mobile.matches?0:-1;gallery.classList.toggle('gallery-mobile-ready',mobile.matches);select(category)}
  mobile.addEventListener('change',layout);window.addEventListener('resize',()=>{if(!frame)frame=requestAnimationFrame(update)},{passive:true});layout();
})();
