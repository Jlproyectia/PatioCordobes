/* Motion enhances visible content; no element depends on animation to appear. */
(()=>{
  const preference=matchMedia('(prefers-reduced-motion: reduce)');
  let cleanup=()=>{};
  function setup(){
    cleanup();
    if(preference.matches)return;
    document.documentElement.classList.add('patio-motion');
    const animations=new Set(),listeners=[];
    const animate=(el,frames,options)=>{
      const animation=el.animate(frames,options);animations.add(animation);
      animation.finished.then(()=>animations.delete(animation),()=>animations.delete(animation));
      return animation;
    };
    const on=(el,event,fn)=>{el.addEventListener(event,fn,{passive:true});listeners.push(()=>el.removeEventListener(event,fn))};
    const targets=document.querySelectorAll('.organized-grid>figure,.gallery-grid>figure,.review-card,.menu-dish,.celebrate-content,.reserve-content,.footer-grid>div,.organized-heading>div,.kitchen-strip>figure');
    const observer=new IntersectionObserver(entries=>{
      const visible=entries.filter(entry=>entry.isIntersecting&&!entry.target.hidden);
      visible.forEach(({target},index)=>{
        observer.unobserve(target);
        animate(target,[{opacity:0,transform:'translateY(34px) scale(.98)'},{opacity:1,transform:'translateY(0) scale(1)'}],{duration:800,delay:Math.min(index%4*85,255),easing:'cubic-bezier(.2,.7,.2,1)',fill:'backwards'});
        const caption=target.querySelector('figcaption');
        if(caption)animate(caption,[{opacity:0,transform:'translateX(-12px)'},{opacity:1,transform:'translateX(0)'}],{duration:650,delay:180+index%4*85,easing:'ease-out',fill:'backwards'});
      });
    },{threshold:.08});
    targets.forEach(target=>observer.observe(target));
    document.querySelectorAll('.hero-caption>.eyebrow,.hero-caption>h1,.hero-bottom>p,.hero-actions').forEach((el,index)=>{
      animate(el,[{opacity:0,transform:'translateY(24px)'},{opacity:1,transform:'translateY(0)'}],{duration:900,delay:120+index*130,easing:'cubic-bezier(.2,.7,.2,1)',fill:'backwards'});
    });
    const backgrounds=[...document.querySelectorAll('.celebrate-background img,.dessert-banner>figure img')];
    const visibleBackgrounds=new Set();
    const backgroundObserver=new IntersectionObserver(entries=>entries.forEach(({target,isIntersecting})=>{if(isIntersecting)visibleBackgrounds.add(target);else visibleBackgrounds.delete(target);schedule()}));
    backgrounds.forEach(el=>backgroundObserver.observe(el));
    let frame=0;
    function update(){frame=0;visibleBackgrounds.forEach(el=>{const rect=el.parentElement.getBoundingClientRect();const progress=(innerHeight/2-rect.top-rect.height/2)/(innerHeight+rect.height);el.style.transform=`translateY(${Math.max(-24,Math.min(24,progress*55))}px) scale(1.08)`})}
    function schedule(){if(!frame)frame=requestAnimationFrame(update)}
    on(window,'scroll',schedule);on(window,'resize',schedule);
    if(matchMedia('(hover: hover) and (pointer: fine)').matches){
      document.querySelectorAll('.organized-image,.gallery-grid figure>div').forEach(el=>{
        on(el,'pointermove',event=>{const rect=el.getBoundingClientRect();el.style.setProperty('--look-x',`${(event.clientX-rect.left)/rect.width*100}%`);el.style.setProperty('--look-y',`${(event.clientY-rect.top)/rect.height*100}%`)});
        on(el,'pointerleave',()=>{el.style.removeProperty('--look-x');el.style.removeProperty('--look-y')});
      });
    }
    cleanup=()=>{observer.disconnect();backgroundObserver.disconnect();cancelAnimationFrame(frame);animations.forEach(animation=>animation.cancel());listeners.forEach(remove=>remove());backgrounds.forEach(el=>el.style.removeProperty('transform'));document.documentElement.classList.remove('patio-motion')};
  }
  setup();preference.addEventListener('change',setup);
})();
