// Chạy: node tests/logic.test.mjs  (không cần thư viện)
import assert from 'node:assert/strict';
import { match } from '../assets/js/chatbot.js';
import { readFileSync } from 'node:fs';

const seed = JSON.parse(readFileSync(new URL('../data/seed.json', import.meta.url)));
const opts = seed.docs.chatbot.options;
const pick = (t) => match(t, opts)?.label;
assert.equal(pick('tôi muốn xin việc'), 'Tìm kiếm việc làm');
assert.equal(pick('bao gia xay nha tron goi'), 'Tìm hiểu dịch vụ xây dựng');
assert.equal(pick('cho xem mau biet thu'), 'Xem công trình đã thực hiện');
assert.equal(pick('số điện thoại hotline'), 'Liên hệ nhân viên');
assert.equal(pick('thời tiết hôm nay'), undefined);

// dữ liệu mẫu phải khớp: mỗi khối trang chủ có renderer, nhóm công trình hợp lệ, slug không trùng
const keys = ['hero', 'intro', 'services', 'process', 'projects', 'capability', 'jobs', 'contact'];
assert.deepEqual(seed.docs.home.sections.map((s) => s.key).sort(), [...keys].sort());
for (const p of seed.collections.projects) assert.ok(seed.docs.site.projectCategories.includes(p.category), p.name);
for (const c of ['services', 'projects', 'jobs']) { const sl = seed.collections[c].map((x) => x.slug); assert.equal(new Set(sl).size, sl.length, c); }
assert.equal(seed.docs.home.process.steps.length, 5, 'mô hình 3D có đúng 5 giai đoạn');
console.log('ok – logic tests passed');
