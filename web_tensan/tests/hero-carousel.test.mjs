import test from 'node:test';
import assert from 'node:assert/strict';

test('banner navigation wraps both directions and rejects invalid indices', async () => {
  const { slideIndex } = await import('../src/hero-carousel.js');
  assert.equal(slideIndex(3, 3), 0);
  assert.equal(slideIndex(-1, 3), 2);
  assert.equal(slideIndex(1, 3), 1);
  assert.equal(slideIndex(5, 5), 0);
  assert.equal(slideIndex(-1, 5), 4);
  assert.throws(() => slideIndex(NaN, 3), RangeError);
  assert.throws(() => slideIndex(0, 0), RangeError);
});

test('selected references become three interactive models and two animated image banners',async()=>{
  const {heroMarkup}=await import('../src/assembly-markup.js');
  const html=heroMarkup();
  assert.equal((html.match(/class="hero-slide(?: |")/g)||[]).length,5);
  assert.match(html,/id="hero-scene"/);
  assert.match(html,/data-product-scene="led"/);
  assert.match(html,/data-product-scene="solder"/);
  assert.equal((html.match(/data-animated-banner=/g)||[]).length,2);
  assert.match(html,/banner-factory-motion.webp/);
  assert.match(html,/banner-red-smt-motion.webp/);
});
