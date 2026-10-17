import test from 'node:test';
import assert from 'node:assert/strict';

test('banner navigation wraps both directions and rejects invalid indices', async () => {
  const { slideIndex } = await import('../src/hero-carousel.js');
  assert.equal(slideIndex(3, 3), 0);
  assert.equal(slideIndex(-1, 3), 2);
  assert.equal(slideIndex(1, 3), 1);
  assert.throws(() => slideIndex(NaN, 3), RangeError);
  assert.throws(() => slideIndex(0, 0), RangeError);
});
