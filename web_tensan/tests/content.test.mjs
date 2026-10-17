import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { products, categories } from '../src/data.js';

test('every public source product survives the migration with a local image and valid category', () => {
  const source = JSON.parse(readFileSync(new URL('../docs/catalog-source.json', import.meta.url)));
  const urls = new Set(products.map(p => p.source));
  assert.equal(new Set(products.map(p => p.id)).size, products.length);
  for (const product of source) assert.ok(urls.has(product.permalink), `Missing source product: ${product.name}`);
  for (const product of products) {
    assert.ok(categories.some(category => category.id === product.category), product.id);
    assert.ok(existsSync(new URL('../public/assets/' + product.image, import.meta.url)), product.image);
  }
});
