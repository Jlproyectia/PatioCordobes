(()=>{
  const track=document.querySelector('#review-list');
  if(!track)return;
  const cards=[...track.querySelectorAll('.review-card')];
  const count=document.querySelector('#review-count');
  const prev=document.querySelector('#review-prev'),next=document.querySelector('#review-next');
  function controls(){prev.disabled=track.scrollLeft<2;next.disabled=track.scrollLeft>=track.scrollWidth-track.clientWidth-2;}
  function update(){
    cards.forEach(card=>card.hidden=false);
    const total=cards.filter(card=>!card.hidden).length;
    count.dataset.es=`${total} reseñas · Desliza para descubrirlas`;
    count.dataset.en=`${total} reviews · Swipe to explore`;
    count.textContent=count.dataset[document.documentElement.lang==='en'?'en':'es'];
    track.scrollLeft=0;controls();
  }
  function step(direction){track.scrollBy({left:direction*(track.querySelector('.review-card:not([hidden])').offsetWidth+parseFloat(getComputedStyle(track).gap)),behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});}
  prev.addEventListener('click',()=>step(-1));next.addEventListener('click',()=>step(1));
  track.addEventListener('scroll',controls,{passive:true});new ResizeObserver(controls).observe(track);
  update();
})();
