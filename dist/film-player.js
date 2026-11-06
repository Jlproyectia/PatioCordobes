(() => {
  'use strict';
  const videos = [...document.querySelectorAll('.inline-film video')];
  if (!videos.length) return;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const pausedByUser = new WeakSet();
  let active = null, timer, frame;
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
    if (active !== v || document.hidden || pausedByUser.has(v)) return;
    const state = states.get(v);
    cover(v);
    if (state.retries >= 2) { cancel(v); v.pause(); button(v); return; }
    state.retries++;
    cancel(v);
    v.pause();
    v.load();
    play(v);
  }
  const media = v => v.closest('.film-media');
  const cover = v => media(v).classList.remove('has-frame');
  function button(v) {
    const btn = media(v).querySelector('.film-pause');
    btn.innerHTML = `<span aria-hidden="true">${v.paused ? '▶' : 'Ⅱ'}</span>`;
    btn.classList.toggle('is-playing', !v.paused);
    btn.setAttribute('aria-label', document.documentElement.lang === 'en' ? (v.paused ? 'Play video' : 'Pause video') : (v.paused ? 'Reproducir vídeo' : 'Pausar vídeo'));
  }
  function release(v) {
    cancel(v);
    cover(v);
    v.pause();
    const source = v.querySelector('source');
    if (source.hasAttribute('src')) {
      source.removeAttribute('src');
      v.load(); // Release offscreen decoders and buffers, especially on iOS.
    }
  }
  function play(v) {
    if (active !== v) {
      videos.forEach(other => { if (other !== v) release(other); });
      active = v;
      states.get(v).retries = 0;
    }
    const source = v.querySelector('source');
    v.muted = true;
    v.defaultMuted = true;
    if (!source.hasAttribute('src')) {
      source.src = source.dataset.src;
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
    if (document.hidden) { videos.forEach(release); active = null; return; }
    const candidates = videos.map(v => ({v, area: visibleArea(v)})).filter(item => item.area > .5).sort((a, b) => b.area - a.area);
    const target = candidates[0]?.v;
    if (active && active !== target) { release(active); active = null; }
    if (target && !reduced.matches && !pausedByUser.has(target)) play(target);
  }
  function scrolling() {
    // Do not start new decoders while a swipe is still moving.
    if (!frame) frame = requestAnimationFrame(() => {
      frame = null;
      if (active && visibleArea(active) < .5) { release(active); active = null; }
    });
    clearTimeout(timer);
    timer = setTimeout(settle, 180);
  }
  videos.forEach(v => {
    button(v);
    let previousTime = 0;
    v.addEventListener('playing', () => { ready(v); button(v); });
    for (const event of ['waiting', 'stalled', 'seeking', 'emptied', 'error']) v.addEventListener(event, () => {
      cover(v);
      const state = states.get(v);
      if (active === v && !pausedByUser.has(v)) {
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
    media(v).querySelector('.film-pause').addEventListener('click', () => {
      if (v.paused) { pausedByUser.delete(v); states.get(v).retries = 0; play(v); }
      else { pausedByUser.add(v); v.pause(); }
    });
  });
  document.querySelectorAll('.reel-track').forEach(track => {
    track.addEventListener('reelchange', () => { if (active) { release(active); active = null; } });
    track.addEventListener('scroll', scrolling, {passive: true});
    track.addEventListener('scrollend', settle);
  });
  addEventListener('scroll', scrolling, {passive: true});
  addEventListener('resize', scrolling);
  addEventListener('pagehide', () => { clearTimeout(timer); videos.forEach(release); active = null; });
  addEventListener('pageshow', settle);
  document.addEventListener('visibilitychange', settle);
  reduced.addEventListener('change', () => { if (reduced.matches) { videos.forEach(release); active = null; } else settle(); });
  // Load real covers up front, including slides approached by rapid swipes.
  document.querySelectorAll('.film-poster').forEach(img => { img.loading = 'eager'; });
  settle();
})();
