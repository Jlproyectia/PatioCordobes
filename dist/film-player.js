(() => {
  'use strict';
  const videos = [...document.querySelectorAll('.inline-film video')];
  if (!videos.length) return;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const pausedByUser = new WeakSet();
  let active = null, timer, frame;
  const media = v => v.closest('.film-media');
  const cover = v => media(v).classList.remove('has-frame');
  function button(v) {
    const btn = media(v).querySelector('.film-pause');
    btn.innerHTML = `<span aria-hidden="true">${v.paused ? '▶' : 'Ⅱ'}</span>`;
    btn.classList.toggle('is-playing', !v.paused);
    btn.setAttribute('aria-label', document.documentElement.lang === 'en' ? (v.paused ? 'Play video' : 'Pause video') : (v.paused ? 'Reproducir vídeo' : 'Pausar vídeo'));
  }
  function release(v) {
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
    }
    const source = v.querySelector('source');
    v.muted = true;
    v.defaultMuted = true;
    if (!source.hasAttribute('src')) {
      source.src = source.dataset.src;
      v.load();
    } else if (v.error) v.load();
    v.play().catch(() => { cover(v); button(v); });
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
    const reveal = () => { if (active === v && !v.paused && !v.seeking && v.readyState >= 2) media(v).classList.add('has-frame'); };
    v.addEventListener('playing', () => {
      if ('requestVideoFrameCallback' in v) v.requestVideoFrameCallback(reveal);
      else requestAnimationFrame(reveal);
      button(v);
    });
    for (const event of ['waiting', 'stalled', 'seeking', 'emptied', 'error']) v.addEventListener(event, () => cover(v));
    v.addEventListener('timeupdate', reveal);
    v.addEventListener('pause', () => { cover(v); button(v); });
    media(v).querySelector('.film-pause').addEventListener('click', () => {
      if (v.paused) { pausedByUser.delete(v); play(v); }
      else { pausedByUser.add(v); v.pause(); }
    });
  });
  document.querySelectorAll('.reel-track').forEach(track => {
    track.addEventListener('scroll', scrolling, {passive: true});
    track.addEventListener('scrollend', settle);
  });
  addEventListener('scroll', scrolling, {passive: true});
  addEventListener('resize', scrolling);
  addEventListener('pagehide', () => { clearTimeout(timer); videos.forEach(release); active = null; });
  addEventListener('pageshow', settle);
  document.addEventListener('visibilitychange', settle);
  reduced.addEventListener('change', () => { if (reduced.matches) { videos.forEach(release); active = null; } else settle(); });
  settle();
})();
