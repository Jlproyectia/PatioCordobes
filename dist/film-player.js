(() => {
  'use strict';
  const videos = [...document.querySelectorAll('.inline-film video')];
  if (!videos.length) return;
  let manuallyPaused = false;
  let active = null, timer;
  const states = new WeakMap(videos.map(v => [v, {generation: 0, watchdog: null, frameId: null, retries: 0}]));
  function cancel(v) {
    const state = states.get(v);
    state.generation++;
    clearTimeout(state.watchdog);
    if (state.frameId !== null && v.cancelVideoFrameCallback) v.cancelVideoFrameCallback(state.frameId);
    state.frameId = null;
  }
  function ready(v) {
    const state = states.get(v), generation = state.generation;
    if (active !== v || v.paused) return;
    if (v.requestVideoFrameCallback) {
      if (state.frameId !== null) return;
      state.frameId = v.requestVideoFrameCallback(() => {
        state.frameId = null;
        if (state.generation !== generation || active !== v || v.paused || v.seeking || v.readyState < 2) return;
        media(v).classList.add('has-frame');
        state.retries = 0;
        clearTimeout(state.watchdog);
        state.watchdog = setTimeout(() => recover(v), 5000);
        ready(v);
      });
    }
  }
  function recover(v) {
    if (active !== v || document.hidden || manuallyPaused) return;
    const state = states.get(v);
    cover(v);
    if (state.retries >= 2) { cancel(v); v.pause(); button(v); return; }
    state.retries++;
    cancel(v);
    v.pause();
    v.load();
    play(v);
  }
  const videoURL = source => source.dataset.src.startsWith('assets/videos/') ? source.dataset.src+'?v=fullhd-1' : source.dataset.src;
  const media = v => v.closest('.film-media');
  const cover = v => media(v).classList.remove('has-frame');
  function button(v) {
    const btn = media(v).querySelector('.film-pause');
    btn.innerHTML = `<span aria-hidden="true">${v.paused ? '▶' : 'Ⅱ'}</span>`;
    btn.classList.toggle('is-playing', !v.paused);
    btn.setAttribute('aria-label', document.documentElement.lang === 'en' ? (v.paused ? 'Play video' : 'Pause video') : (v.paused ? 'Reproducir vídeo' : 'Pausar vídeo'));
  }
  function release(v, unload = true) {
    cancel(v);
    cover(v);
    v.autoplay = false;
    v.pause();
    const source = v.querySelector('source');
    if (unload && source.hasAttribute('src')) {
      source.removeAttribute('src');
      v.load(); // Release offscreen decoders and buffers, especially on iOS.
    }
  }
  function play(v) {
    if (active !== v) {
      const index=videos.indexOf(v);
      videos.forEach((other,i) => {if(other!==v)release(other,Math.abs(i-index)>1);});
      active = v;
      states.get(v).retries = 0;
      const following=videos[index+1];
      if(following){
        const source=following.querySelector('source');
        if(!source.hasAttribute('src')){
          following.autoplay=false;
          following.preload='metadata';
          source.src=videoURL(source);
          following.load();
        }
      }
    }
    const source = v.querySelector('source');
    v.muted = true;
    v.defaultMuted = true;
    v.autoplay = true;
    v.playsInline = true;
    v.preload = 'auto';
    if (!source.hasAttribute('src')) {
      source.src = videoURL(source);
      v.load();
    } else if (v.error) v.load();
    const state = states.get(v), generation = state.generation;
    clearTimeout(state.watchdog);
    state.watchdog = setTimeout(() => recover(v), 7000);
    v.play().then(() => { if (state.generation === generation) ready(v); }).catch(() => {
      if (state.generation !== generation) return;
      cover(v); button(v);
      clearTimeout(state.watchdog);
    });
  }
  function visibleArea(v) {
    const r = v.getBoundingClientRect();
    const track = v.closest('.reel-track');
    const bounds = track ? track.getBoundingClientRect() : {left: 0, right: innerWidth};
    const width = Math.max(0, Math.min(r.right, bounds.right, innerWidth) - Math.max(r.left, bounds.left, 0));
    const height = Math.max(0, Math.min(r.bottom, innerHeight) - Math.max(r.top, 0));
    return width * height / (r.width * r.height || 1);
  }
  function settle() {
    clearTimeout(timer);
    if (document.hidden) { videos.forEach(v=>release(v)); active = null; return; }
    const candidates = videos.map(v => ({v, area: visibleArea(v)})).filter(item => item.area > .5).sort((a, b) => b.area - a.area);
    const target = candidates[0]?.v;
    if(!target){videos.forEach(v=>release(v));active=null;return;}
    if (active && active !== target) { release(active, !target); active = null; }
    if (target && !manuallyPaused) play(target);
  }
  function scrolling() {
    clearTimeout(timer);
    timer = setTimeout(settle, 100);
  }
  videos.forEach(v => {
    button(v);
    let previousTime = 0;
    v.addEventListener('playing', () => { ready(v); button(v); });
    for (const event of ['waiting', 'stalled', 'seeking', 'emptied', 'error']) v.addEventListener(event, () => {
      cover(v);
      const state = states.get(v);
      if (active === v && !manuallyPaused) {
        clearTimeout(state.watchdog);
        state.watchdog = setTimeout(() => recover(v), 5000);
      }
    });
    v.addEventListener('timeupdate', () => {
      // Older Safari: require actual playback progress, not just readyState.
      if (!v.requestVideoFrameCallback && active === v && !v.paused && !v.seeking && v.readyState >= 3 && v.currentTime !== previousTime) {
        media(v).classList.add('has-frame');
        const state = states.get(v);
        state.retries = 0;
        clearTimeout(state.watchdog);
        state.watchdog = setTimeout(() => recover(v), 5000);
      }
      previousTime = v.currentTime;
    });
    v.addEventListener('pause', () => { cover(v); button(v); });
    const control=media(v).querySelector('.film-pause');control.hidden=!!v.closest('.reel-track');
    if(!control.hidden)control.addEventListener('click',()=>{if(v.paused){manuallyPaused=false;play(v);}else{manuallyPaused=true;v.pause();}});
  });
  document.querySelectorAll('.reel-track').forEach(track => {
    track.addEventListener('reelchange', event => {if(event.detail?.video&&!manuallyPaused)play(event.detail.video);});
    track.addEventListener('scroll', scrolling, {passive: true});
    track.addEventListener('scrollend', settle);
  });
  addEventListener('scroll', scrolling, {passive: true});
  addEventListener('resize', scrolling);
  addEventListener('pagehide', () => { clearTimeout(timer); videos.forEach(v=>release(v)); active = null; });
  addEventListener('pageshow', settle);
  document.addEventListener('visibilitychange', settle);
  const controls=document.querySelector('.reel-controls');
  if(controls){const pause=document.createElement('button');pause.type='button';pause.className='reel-auto-pause';pause.textContent='Pausar vídeos';pause.addEventListener('click',()=>{manuallyPaused=!manuallyPaused;pause.textContent=manuallyPaused?'Reanudar vídeos':'Pausar vídeos';pause.setAttribute('aria-pressed',String(manuallyPaused));if(manuallyPaused){videos.forEach(v=>release(v,false));active=null;}else settle();});controls.append(pause);}
  // Retry from an ordinary swipe or navigation gesture if the browser initially blocked autoplay.
  document.addEventListener('touchend',()=>{if(!manuallyPaused)settle();},{passive:true});
  document.addEventListener('click',()=>{if(active&&active.paused&&!manuallyPaused)play(active);});
  // Load real covers up front, including slides approached by rapid swipes.
  document.querySelectorAll('.film-poster').forEach(img => { img.loading = 'eager'; });
  settle();
})();
