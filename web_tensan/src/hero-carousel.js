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
  let active = 0, swipe = null, suppressClickUntil = 0;
  const fit = () => { viewport.style.height = `${slides[active].offsetHeight}px`; };
  function show(index) {
    active = slideIndex(index, slides.length);
    slides.forEach((slide, i) => {
      slide.inert = i !== active;
      slide.setAttribute('aria-hidden', String(i !== active));
      buttons[i].setAttribute('aria-pressed', String(i === active));
    });
    track.style.transform = `translateX(-${active * 100}%)`;
    root.querySelector('.banner-count').textContent = `0${active + 1} / 03`;
    root.querySelector('[data-banner-status]').textContent = slides[active].getAttribute('aria-label');
    fit();
    refreshLayout();
  }
  buttons.forEach((button, index) => on(button, 'click', () => show(index)));
  on(root.querySelector('[data-banner-prev]'), 'click', () => show(active - 1));
  on(root.querySelector('[data-banner-next]'), 'click', () => show(active + 1));
  on(root.querySelector('.hero-carousel-nav'), 'keydown', event => {
    if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
    event.preventDefault(); show(active + (event.key === 'ArrowLeft' ? -1 : 1));
    buttons[active].focus();
  });
  on(viewport, 'pointerdown', event => {
    if (!event.isPrimary || event.button !== 0 || event.target.closest('.assembly-view, button')) return;
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
  fit();
  return () => { abort.abort(); observer.disconnect(); };
}
