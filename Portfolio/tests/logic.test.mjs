import test from 'node:test';
import assert from 'node:assert/strict';
import { getPublicProjects, searchProjects, getProject, validateContact, saveDraft } from '../src/repository.js';

const fixtures = [
  {slug:'shop',title:'Cửa hàng gốm',category:'Website',status:'published',description:'Thiết kế cửa hàng',privateClient:true,clientName:'Secret',clientEmail:'secret@example.com'},
  {slug:'app',title:'Đặt lịch',category:'App',status:'published',description:'Chọn thời gian'},
  {slug:'draft',title:'Draft',category:'Website',status:'draft'},
];
test('private identity removed and drafts excluded from all public lookup paths', () => {
  const projects=getPublicProjects(fixtures);
  assert.equal(projects.length,2);
  assert.equal(projects[0].clientName,undefined);
  assert.equal(projects[0].clientEmail,undefined);
  assert.equal(getProject('draft',fixtures),undefined);
});
test('accent insensitive search composes with category filter',()=>{
  assert.equal(searchProjects({query:'CUA HANG',category:'Website'},fixtures).length,1);
  assert.equal(searchProjects({query:'đặt lịch',category:'Website'},fixtures).length,0);
  assert.equal(searchProjects({query:'dat lich',category:'App'},fixtures).length,1);
  assert.equal(searchProjects({query:'nothing',category:'all'},fixtures).length,0);
});
test('form requires name, valid contact, service and meaningful description',()=>{
  const valid={name:'An',contact:'an@example.com',service:'Website',message:'Tôi cần một website bán hàng.'};
  assert.deepEqual(validateContact(valid),{});
  assert.deepEqual(validateContact({...valid,contact:'0901234567'}),{});
  assert.ok(validateContact({...valid,contact:'abc@'}).contact);
  assert.ok(validateContact({...valid,message:'a'}).message);
  assert.ok(validateContact({...valid,name:''}).name);
  assert.ok(validateContact({...valid,service:''}).service);
});
test('local drafts report storage failure and never imply server delivery',()=>{
  const data={name:'An',contact:'an@example.com',service:'Website',message:'Website bán hàng mới'};
  const calls=[];
  assert.deepEqual(saveDraft(data,{setItem:(...args)=>calls.push(args)}),{saved:true,sent:false});
  assert.equal(calls.length,1);
  assert.equal(JSON.parse(calls[0][1]).name,'An');
  assert.deepEqual(saveDraft(data,{setItem:()=>{throw Error('blocked');}}),{saved:false,sent:false});
});
