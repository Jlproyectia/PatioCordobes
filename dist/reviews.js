(()=>{
  const track=document.querySelector('#review-list');
  if(!track)return;
  const cards=[...track.querySelectorAll('.review-card')];
  const filters=[...document.querySelectorAll('[data-review-filter]')];
  const count=document.querySelector('#review-count');
  const prev=document.querySelector('#review-prev'),next=document.querySelector('#review-next');
  function controls(){prev.disabled=track.scrollLeft<2;next.disabled=track.scrollLeft>=track.scrollWidth-track.clientWidth-2;}
  function update(rating='all'){
    cards.forEach(card=>card.hidden=rating!=='all'&&card.dataset.rating!==rating);
    const total=cards.filter(card=>!card.hidden).length;
    count.dataset.es=`${total} reseñas · Desliza para descubrirlas`;
    count.dataset.en=`${total} reviews · Swipe to explore`;
    count.textContent=count.dataset[document.documentElement.lang==='en'?'en':'es'];
    filters.forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.reviewFilter===rating)));
    track.scrollLeft=0;controls();
  }
  function step(direction){track.scrollBy({left:direction*(track.querySelector('.review-card:not([hidden])').offsetWidth+parseFloat(getComputedStyle(track).gap)),behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});}
  prev.addEventListener('click',()=>step(-1));next.addEventListener('click',()=>step(1));
  track.addEventListener('scroll',controls,{passive:true});new ResizeObserver(controls).observe(track);
  filters.forEach(b=>b.addEventListener('click',()=>update(b.dataset.reviewFilter)));
  document.querySelector('.review-filters').hidden=false;update();
})();
