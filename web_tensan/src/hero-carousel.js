export function slideIndex(index, count) {
  if (!Number.isInteger(index) || !Number.isInteger(count) || count < 1) throw new RangeError('Invalid slide index or count');
  return ((index % count) + count) % count;
}

export function createHeroCarousel(root, refreshLayout) {
  const viewport = root.querySelector('.hero-carousel-viewport');
  const track = root.querySelector('.hero-carousel-track');
  const slides = [...track.children];
  const buttons = [...root.querySelectorAll('[data-slide]')];
  const abort = new AbortController();
  const on = (node, type, handler) => node.addEventListener(type, handler, { signal: abort.signal });
  const media=matchMedia('(prefers-reduced-motion: reduce)'), play=root.querySelector('[data-carousel-play]');
  const phase=root.querySelector('[data-demo-status]');
  let active = 0, swipe = null, suppressClickUntil = 0;
  let playing=!media.matches, visible=false;
  const command=(action,slide=slides[active])=>slide.dispatchEvent(new CustomEvent('hero-demo',{detail:action}));
  const sequence=createDemoSequence({
    reset:()=>{root.dataset.demoPhase='rotate';phase.textContent=slides[active].querySelector('#hero-scene,[data-product-scene]')?'Tự xoay · 3 giây':'Hoạt ảnh · 3 giây';command('reset');},
    assemble:()=>{root.dataset.demoPhase='assemble';phase.textContent='Đang lắp ráp';command('assemble');},
    next:()=>show(active+1)
  });
  function syncPlayback(pauseScene=true){
    sequence.stop();
    play.disabled=media.matches;play.setAttribute('aria-pressed',String(playing));play.setAttribute('aria-label',playing?'Tạm dừng trình chiếu':'Bật trình chiếu tự động');play.innerHTML=icon(playing?'pause':'play');
    root.querySelector('[data-banner-status]').setAttribute('aria-live',playing?'off':'polite');
    const status=slides[active].querySelector('#hero-scene,[data-product-scene]');
    if(playing&&visible&&!document.hidden&&!media.matches){
      if(status&&!status.dataset.renderer){phase.textContent='Đang chuẩn bị mô hình';return;}
      sequence.start(Boolean(status));
    }else{root.dataset.demoPhase='paused';phase.textContent='Đã dừng trình chiếu';if(pauseScene)command('pause');}
  }
  function pausePlayback(event){
    if(!playing)return;
    playing=false;
    const localToggle=event?.target?.closest('#motion-toggle,[data-model-play],.banner-animation-toggle');
    syncPlayback(!localToggle);
  }
  const fit = () => { viewport.style.height = `${slides[active].offsetHeight}px`; };
  function show(index) {
    sequence.stop();command('pause');
    active = slideIndex(index, slides.length);
    slides.forEach((slide, i) => {
      slide.inert = i !== active;
      slide.setAttribute('aria-hidden', String(i !== active));
      buttons[i].setAttribute('aria-pressed', String(i === active));
    });
    track.style.transform = `translateX(-${active * 100}%)`;
    root.querySelector('.banner-count').textContent = `0${active + 1} / 0${slides.length}`;
    root.querySelector('[data-banner-status]').textContent = slides[active].getAttribute('aria-label');
    root.querySelector('.banner-selectors').scrollTo({left:buttons[active].offsetLeft-buttons[0].offsetLeft,behavior:media.matches?'instant':'smooth'});
    fit();
    refreshLayout();
    syncPlayback();
  }
  on(play,'click',()=>{playing=!playing&&!media.matches;syncPlayback();});
  on(root,'hero-model-ready',event=>{if(slides[active].contains(event.target))syncPlayback();});
  on(root,'focusin',event=>{if(event.target!==play)pausePlayback();});
  on(viewport,'pointerdown',pausePlayback);
  on(document,'visibilitychange',syncPlayback);
  on(media,'change',()=>{if(media.matches)playing=false;syncPlayback();});
  on(track,'transitionend',event=>{if(playing&&event.target===track&&event.propertyName==='transform')syncPlayback();});
  buttons.forEach((button, index) => on(button, 'click', () => show(index)));
  on(root.querySelector('[data-banner-prev]'), 'click', () => show(active - 1));
  on(root.querySelector('[data-banner-next]'), 'click', () => show(active + 1));
  on(root.querySelector('.hero-carousel-nav'), 'keydown', event => {
    if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
    event.preventDefault(); show(active + (event.key === 'ArrowLeft' ? -1 : 1));
    buttons[active].focus();
  });
  on(viewport, 'pointerdown', event => {
    if (!event.isPrimary || event.button !== 0 || event.target.closest('.assembly-view, .product-model-view, button')) return;
    swipe = { x: event.clientX, y: event.clientY, id: event.pointerId };
  });
  on(viewport, 'pointerup', event => {
    if (!swipe || event.pointerId !== swipe.id) return;
    const dx = event.clientX - swipe.x, dy = event.clientY - swipe.y;
    swipe = null;
    if (Math.abs(dx) > 55 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      show(active + (dx < 0 ? 1 : -1));
      // Suppress the link click generated after a completed swipe.
      suppressClickUntil = performance.now() + 500;
    }
  });
  on(viewport, 'pointercancel', () => { swipe = null; });
  viewport.addEventListener('click', event => {
    if (performance.now() < suppressClickUntil) { event.preventDefault(); event.stopPropagation(); }
  }, { capture: true, signal: abort.signal });
  on(viewport, 'dragstart', event => event.preventDefault());
  on(viewport, 'transitionend', event => { if (event.target === viewport) refreshLayout(); });
  const observer = new ResizeObserver(fit);
  slides.forEach(slide => observer.observe(slide));
  const visibility=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;syncPlayback();},{threshold:.05});visibility.observe(viewport);
  fit();
  syncPlayback();
  return () => { sequence.stop();abort.abort();observer.disconnect();visibility.disconnect(); };
}
import { createDemoSequence } from './demo-sequence.js';
import { icon } from './icons.js';
