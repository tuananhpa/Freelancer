import { useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

if (typeof window !== 'undefined') {
  window.gsap = gsap;
  window.ScrollTrigger = ScrollTrigger;
}

export { gsap, ScrollTrigger };

export function usePageMotion(deps = []) {
  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) return;

    document.documentElement.classList.add('js-motion');

    const revealIO = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          revealIO.unobserve(e.target);
          if (e.target._items) {
            gsap.to(e.target._items, {
              autoAlpha: 1,
              y: 0,
              duration: 0.9,
              ease: 'expo.out',
              stagger: 0.075,
              overwrite: true,
              clearProps: 'transform',
            });
          }
        }),
      { rootMargin: '0px 0px -10% 0px' }
    );

    const groups = document.querySelectorAll('[data-reveal-group]');
    groups.forEach((grp) => {
      if (grp._revealed) return;
      const items = grp.querySelectorAll('[data-reveal]');
      if (!items.length) return;
      grp._revealed = true;
      gsap.set(items, { autoAlpha: 0, y: 26 });
      grp._items = items;
      revealIO.observe(grp);
    });

    const parallaxTriggers = [];
    gsap.utils.toArray('[data-parallax]').forEach((el) => {
      if (el._parallaxBound) return;
      el._parallaxBound = true;
      const amt = parseFloat(el.dataset.parallax) || 8;
      const tween = gsap.fromTo(
        el,
        { yPercent: amt },
        {
          yPercent: -amt,
          ease: 'none',
          scrollTrigger: {
            trigger: el.closest('section') || el,
            start: 'top bottom',
            end: 'bottom top',
            scrub: 0.6,
          },
        }
      );
      if (tween.scrollTrigger) parallaxTriggers.push(tween.scrollTrigger);
    });

    const t1 = setTimeout(() => ScrollTrigger.refresh(), 300);
    const onLoad = () => ScrollTrigger.refresh();
    window.addEventListener('load', onLoad);
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => ScrollTrigger.refresh());
    }

    return () => {
      clearTimeout(t1);
      window.removeEventListener('load', onLoad);
      revealIO.disconnect();
      parallaxTriggers.forEach((st) => st.kill());
    };
  }, deps);
}
