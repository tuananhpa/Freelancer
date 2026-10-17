import test from 'node:test';
import assert from 'node:assert/strict';
import { filterProducts, getProduct } from '../src/catalog.js';

const products = [
  { id: 'ts1001', code: 'TS1001', name: 'Keo tản nhiệt TS1001', category: 'tan-nhiet', applications: ['Điện tử', 'Đèn LED'] },
  { id: 'ts5505', code: 'TS5505', name: 'Keo silicone tản nhiệt TS5505', category: 'silicone', applications: ['Đèn LED'] },
  { id: 'ts8833', code: 'TS8833', name: 'Keo AB hai thành phần TS8833', category: 'keo-cong-nghiep', applications: ['Nguồn điện'] },
];
test('finds Vietnamese product names without accents, including đ', () => {
  assert.deepEqual(filterProducts(products, { query: '  den led  ' }).map(p => p.id), ['ts1001', 'ts5505']);
  assert.deepEqual(filterProducts(products, { query: 'TẢN NHIỆT' }).map(p => p.id), ['ts1001', 'ts5505']);
});
test('combines query and category rather than leaking other results', () => {
  assert.deepEqual(filterProducts(products, { query: 'tan nhiet', category: 'silicone' }).map(p => p.id), ['ts5505']);
  assert.deepEqual(filterProducts(products, { query: 'ts1001', category: 'silicone' }), []);
});
test('matches model codes case insensitively and returns useful empty results', () => {
  assert.equal(filterProducts(products, { query: 'Ts8833' })[0].name, 'Keo AB hai thành phần TS8833');
  assert.deepEqual(filterProducts(products, { query: '<script>' }), []);
  assert.equal(filterProducts(products).length, 3);
});
test('unknown product IDs are absent; valid IDs resolve exact products', () => {
  assert.equal(getProduct(products, 'missing'), undefined);
  assert.equal(getProduct(products, 'ts1001').code, 'TS1001');
});
