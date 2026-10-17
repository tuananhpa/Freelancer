import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
gsap.registerPlugin(ScrollTrigger);

export function createPageMotion(main) {
  const mm = gsap.matchMedia();
  mm.add('(prefers-reduced-motion: no-preference)', () => {
    const heroCopy = main.querySelector('.hero-copy');
    if (heroCopy) {
      gsap.from(heroCopy.children, { y: 22, autoAlpha: 0, duration: 0.85, stagger: 0.1, ease: 'power3.out' });
    }
    main.querySelectorAll('.section-heading, .about-overview, .application-story, .capability-layout').forEach(element => {
      gsap.from(element, { y: 22, autoAlpha: 0, duration: 0.75, ease: 'power2.out', scrollTrigger: { trigger: element, start: 'top 93%', once: true } });
    });
    const categoryImages = main.querySelectorAll('.category-card img');
    if (categoryImages.length) gsap.from(categoryImages, { y: 16, duration: 1, stagger: 0.12, ease: 'power2.out', scrollTrigger: { trigger: '.category-grid', start: 'top 90%', once: true } });
  }, main);
  return () => mm.revert();
}
