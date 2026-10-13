import {test} from 'node:test';
import assert from 'node:assert/strict';
import {buildBinURL, generateBinQR} from '../src/qr.js';
test('QR URL targets the selected bin and student home, dropping old query/hash',()=>{
  assert.equal(buildBinURL('https://school.example/?bin=R02#/admin/settings',' r01 '),'https://school.example/?bin=R01#/home');
  assert.equal(buildBinURL('https://school.example/campus/','R03'),'https://school.example/campus/?bin=R03#/home');
});
test('invalid website URLs and bin IDs are rejected',()=>{
  for(const url of ['school.example','javascript:alert(1)','https://user:password@school.example'])assert.throws(()=>buildBinURL(url,'R01'),/địa chỉ/i);
  for(const id of ['', 'R1', 'R001', 'R01&bin=R02'])assert.throws(()=>buildBinURL('https://school.example',id),/Mã thùng/);
});
test('generated PNG decodes to exactly the selected bin URL',async()=>{
  const {PNG}=await import('pngjs');const {default:jsQR}=await import('jsqr');
  const {url,image}=await generateBinQR('https://school.example','R02');
  assert.ok(image.startsWith('data:image/png;base64,'));
  const png=PNG.sync.read(Buffer.from(image.split(',')[1],'base64'));
  const decoded=jsQR(new Uint8ClampedArray(png.data),png.width,png.height);
  assert.equal(decoded?.data,url);assert.equal(url,'https://school.example/?bin=R02#/home');
});
