import test from 'node:test';
import assert from 'node:assert/strict';
import { buildInquiryMailto } from '../src/inquiry.js';

test('builds a draft with safe encoding rather than inserting email headers from input', () => {
  const href = buildInquiryMailto({ name: 'Nguyễn An', email: 'an@example.com', product: 'TS1001 & TS5505', message: 'Tư vấn keo cho đèn LED\nDùng trong nhà.', company: 'A&B', phone: '090 123' });
  assert.ok(href.startsWith('mailto:contact@tensanvn.com?'));
  const params = new URLSearchParams(href.split('?')[1]);
  assert.equal(params.get('subject'), 'Yêu cầu tư vấn Tensan – TS1001 & TS5505');
  assert.ok(params.get('body').includes('Họ tên: Nguyễn An'));
  assert.ok(params.get('body').includes('Công ty: A&B'));
  assert.ok(params.get('body').includes('Dùng trong nhà.'));
  assert.equal(params.get('cc'), null);
});
