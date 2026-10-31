/** Hiện dần phần tử có [data-reveal] khi cuộn tới; theo dõi cả nội dung SPA mới gắn vào DOM. */
export function startScrollReveal() {
  if (!('IntersectionObserver' in window)) return;
  document.documentElement.classList.add('js-reveal');
  const io = new IntersectionObserver(
    (entries) => entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } }),
    { rootMargin: '0px 0px -8% 0px', threshold: 0.08 },
  );
  const scan = () => document.querySelectorAll('[data-reveal]:not(.is-in)').forEach((el) => io.observe(el));
  new MutationObserver(scan).observe(document.body, { childList: true, subtree: true });
  scan();
}
