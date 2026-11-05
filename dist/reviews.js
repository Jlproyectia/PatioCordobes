(()=>{
  const cards=[...document.querySelectorAll('#review-list .review-card')];
  const filters=[...document.querySelectorAll('[data-review-filter]')];
  const more=document.querySelector('#more-reviews'),count=document.querySelector('#review-count');
  let rating='all',limit=6;
  function update(){
    const matches=cards.filter(card=>rating==='all'||card.dataset.rating===rating);
    cards.forEach(card=>card.hidden=true);
    matches.slice(0,limit).forEach(card=>card.hidden=false);
    const shown=Math.min(limit,matches.length);
    count.dataset.es=`Mostrando ${shown} de ${matches.length} reseñas`;
    count.dataset.en=`Showing ${shown} of ${matches.length} reviews`;
    count.textContent=count.dataset[document.documentElement.lang==='en'?'en':'es'];
    more.hidden=shown===matches.length;
    filters.forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.reviewFilter===rating)));
  }
  filters.forEach(button=>button.addEventListener('click',()=>{rating=button.dataset.reviewFilter;limit=6;update()}));
  more.addEventListener('click',()=>{limit+=12;update()});
  document.querySelector('.review-filters').hidden=false;
  update();
})();
