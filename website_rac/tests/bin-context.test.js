import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readBinContext} from '../src/bin-context.js';
test('QR bin remains available when session storage is blocked',()=>{
  const blocked={getItem(){throw Error('blocked');},setItem(){throw Error('blocked');}};
  assert.equal(readBinContext('?bin=R02',blocked),'R02');
  assert.equal(readBinContext('?bin=R02',null),'R02');
});
test('invalid QR never attaches previous bin',()=>{
  assert.equal(readBinContext('?bin=wrong',{getItem:()=> 'R01'}),null);
  assert.equal(readBinContext('',{getItem:()=> 'R01'}),'R01');
});
