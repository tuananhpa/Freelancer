import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRepository } from '../src/repository.js';
const repo = () => {const r=createRepository(null);r.importStudents([{code:'TEST-AN',name:'An',classId:'11T2'},{code:'TEST-LAN',name:'Lan',classId:'11T3'}]);return r;};
test('instant membership setting applies to new requests, not pending ones',async()=>{
  const r=repo(); r.updateSettings({approvalMode:'instant'});
  assert.equal(r.users().find(u=>u.id==='student-4').membership,'pending');
  await r.register({studentCode:'TEST-LAN',name:'Lan',email:'lan@example.com',password:'12345678'});
  assert.equal(r.currentUser().membership,'approved');
});
test('registration validates email, duplicates and login', async () => {
  const r=repo();
  await assert.rejects(()=>r.register({studentCode:'TEST-AN',name:'An',email:'bad',password:'12345678'}),/Email/);
  await r.register({studentCode:'TEST-AN',name:'An',email:'an@example.com',password:'12345678'});
  await assert.rejects(()=>r.register({studentCode:'TEST-AN',name:'An',email:'AN@example.com',password:'12345678'}),/đã/);
  await assert.rejects(()=>r.login('an@example.com','wrong'),/không đúng/);
  await r.login('an@example.com','12345678'); assert.equal(r.currentUser().name,'An');
});
test('membership approval required and class validated',async()=>{
  const r=repo(); await r.register({studentCode:'TEST-AN',name:'An',email:'an@example.com',password:'12345678'});
  assert.throws(()=>r.requestClass('11T4'),/không hợp lệ/);
  r.requestClass('11T2'); const id=r.currentUser().id;
  assert.equal(r.currentUser().membership,'pending');
  assert.throws(()=>r.recordDeposit({id:'txn-a',userId:id,binId:'R01',type:'plastic',confirmed:true}),/duyệt/);
  r.approveMember(id); assert.equal(r.currentUser().membership,'approved');
});
test('deposit needs confirmation, valid type, and unique id',()=>{
  const r=repo(); const before=r.currentUser().points;
  assert.throws(()=>r.recordDeposit({id:'txn-a',userId:'student-1',binId:'R01',type:'plastic',confirmed:false}),/xác nhận/);
  const tx={id:'txn-a',userId:'student-1',binId:'R01',type:'metal',confirmed:true};
  r.recordDeposit(tx); assert.equal(r.currentUser().points,before+20);
  assert.throws(()=>r.recordDeposit(tx),/trùng/); assert.equal(r.currentUser().points,before+20);
  assert.throws(()=>r.recordDeposit({...tx,id:'txn-b',type:'paper'}),/không/);
});
test('weekly rankings isolate Vietnam date boundary',()=>{
  const r=repo(); const before=r.rankings('2026-10-12').find(c=>c.id==='11T1').points;
  r.recordDeposit({id:'boundary',userId:'student-1',binId:'R01',type:'plastic',confirmed:true,at:'2026-10-18T18:00:00Z'});
  assert.equal(r.rankings('2026-10-12').find(c=>c.id==='11T1').points,before);
  assert.equal(r.rankings('2026-10-19').find(c=>c.id==='11T1').points,10);
});
test('adjustments cannot make personal points negative',()=>{
  const r=repo(); assert.throws(()=>r.adjustPoints('student-1',-121,'Sửa'),/âm/);
  assert.throws(()=>r.adjustPoints('student-1',NaN,'Sửa'),/hợp lệ/);
  r.adjustPoints('student-1',5,'Bổ sung'); assert.equal(r.currentUser().points,125);
});
test('rule change does not recalculate past transactions',()=>{
  const r=repo(); const before=r.currentUser().points;
  r.updateSettings({points:{plastic:15,metal:25}});
  assert.equal(r.currentUser().points,before);
  r.recordDeposit({id:'new-rule',userId:'student-1',binId:'R01',type:'plastic',confirmed:true});
  assert.equal(r.currentUser().points,before+15);
});
test('failed storage write rolls back changed settings',()=>{
  const r=createRepository({getItem:()=>null,setItem:()=>{throw Error('quota');}});
  assert.throws(()=>r.updateSettings({points:{plastic:30}}),/Không lưu/);
  assert.equal(r.settings().points.plastic,10);
});
test('invalid stored schema recovers without breaking rankings',()=>{
  const r=createRepository({getItem:()=>JSON.stringify({users:[],transactions:[],settings:{}}),setItem:()=>{}});
  assert.equal(r.rankings('2026-10-12').length,3);
  assert.match(r.storageError,/Không đọc/);
});
test('blocked storage is reported and cannot silently save changes',()=>{
  const r=createRepository({getItem:()=>{throw Error('blocked');},setItem:()=>{throw Error('blocked');}});
  assert.match(r.storageError,/Không đọc/);
  assert.throws(()=>r.updateSettings({approvalMode:'instant'}),/Không lưu/);
  assert.equal(r.settings().approvalMode,'required');
});
