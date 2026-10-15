import test from 'node:test';
import assert from 'node:assert/strict';
import { filterProducts, resolveRoute, escapeHtml, paginate } from '../src/catalog.js';

const items = [
  {slug:'dan-20',name:'Nhang cây Đàn Hương 20cm',group:'dan-huong',form:'cay',category:'nhang-cay-dan-huong'},
  {slug:'thao-24',name:'Nhang khoanh Thảo Dược 24h',group:'thao-duoc',form:'khoanh',category:'nhang-khoanh-thao-duoc'},
  {slug:'dan-vien',name:'Nhang viên Đàn Hương',group:'dan-huong',form:'vien',category:'nhang-vien-dan-huong'},
];
test('Vietnamese search accepts accents, uppercase, đ and surrounding spaces',()=>{
  assert.equal(filterProducts(items,{q:'  DAN HUONG  '}).length,2);
  assert.equal(filterProducts(items,{q:'thảo dược'})[0].slug,'thao-24');
});
test('group, form and category filters compose without mutating input',()=>{
  assert.deepEqual(filterProducts(items,{group:'dan-huong',form:'vien'}).map(p=>p.slug),['dan-vien']);
  assert.equal(filterProducts(items,{category:'nhang-khoanh-thao-duoc'}).length,1);
  assert.equal(filterProducts(items,{q:'khong-co'}).length,0);
  assert.equal(items.length,3);
});
test('routes preserve original product/category links and reject unknown paths',()=>{
  assert.deepEqual(resolveRoute('/san-pham/dan-20/',items),{page:'product',slug:'dan-20'});
  assert.deepEqual(resolveRoute('/danh-muc-san-pham/nhang-cay-dan-huong/',items),{page:'catalog',category:'nhang-cay-dan-huong'});
  assert.equal(resolveRoute('/san-pham/khong-co/',items).page,'not-found');
  assert.equal(resolveRoute('/xyz/',items).page,'not-found');
  assert.equal(resolveRoute('/my-account/lost-password/',items).page,'reset');
});
test('pagination bounds malformed or out-of-range page numbers',()=>{
  assert.equal(paginate(items,999,2).page,2);
  assert.equal(paginate(items,'oops',2).page,1);
  assert.equal(paginate([],2,2).totalPages,1);
});
test('HTML text and quoted attributes escape untrusted input',()=>{
  assert.equal(escapeHtml('<img src=x onerror="x"> &'), '&lt;img src=x onerror=&quot;x&quot;&gt; &amp;');
  assert.equal(escapeHtml("'"),'&#39;');
});
