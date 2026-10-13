import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createRepository} from '../src/repository.js';
import {prepareStudentImport} from '../src/roster.js';
import {parseStudentWorkbook,makeStudentWorkbook} from '../src/student-excel.js';
import * as XLSX from 'xlsx';
test('missing codes are generated uniquely; identical imports skip, conflicts fail',()=>{
  const rows=[{name:'Nguyễn An',classId:'11T1'},{code:'001234',name:'Trần Bình',classId:'11T2'}];
  const preview=prepareStudentImport(rows,[]);assert.equal(preview.added,2);assert.match(preview.students[0].code,/^HS/);assert.equal(preview.students[1].code,'001234');
  assert.equal(prepareStudentImport(preview.students,preview.students).skipped,2);
  assert.throws(()=>prepareStudentImport([{code:'001234',name:'Khác',classId:'11T2'}],preview.students),/đã thuộc/);
  assert.throws(()=>prepareStudentImport([{name:'Nguyễn An',classId:'11T1'}],preview.students),/mã riêng/);
});
test('invalid or duplicate rows reject the entire import',()=>{
  const r=createRepository(null),before=r.students().length;
  assert.throws(()=>r.importStudents([{code:'NEW1',name:'An',classId:'11T1'},{code:'NEW2',name:'Bình',classId:''}]),/Lớp/);
  assert.equal(r.students().length,before);
  assert.throws(()=>r.importStudents([{code:'NEW1',name:'An',classId:'11T1'},{code:'NEW1',name:'Bình',classId:'11T1'}]),/trùng/);
});
test('only imported matching name can register and code is claimed once',async()=>{
  const r=createRepository(null);r.updateSettings({approvalMode:'instant'});
  r.importStudents([{code:'001234',name:'Nguyễn Văn An',classId:'11T2'}]);
  const details={studentCode:'001234',name:'Nguyễn Văn An',email:'an-roster@example.com',password:'12345678'};
  await assert.rejects(()=>r.register({...details,studentCode:'unknown'}),/danh sách/);
  await assert.rejects(()=>r.register({...details,name:'Sai tên'}),/Họ tên/);
  await r.register({...details,name:'  nguyễn   văn an  '});
  assert.equal(r.currentUser().classId,'11T2');assert.equal(r.currentUser().membership,'approved');assert.equal(r.currentUser().name,'Nguyễn Văn An');
  await assert.rejects(()=>r.register({...details,email:'other@example.com'}),/đã/);
  assert.throws(()=>r.requestClass('11T3'),/danh sách|tham gia/);
});
test('registration claims roster atomically even with simultaneous requests',async()=>{
  const r=createRepository(null);r.importStudents([{code:'ONCE',name:'An',classId:'11T1'}]);
  const input={studentCode:'ONCE',name:'An',password:'12345678'};
  const results=await Promise.allSettled([r.register({...input,email:'one@example.com'}),r.register({...input,email:'two@example.com'})]);
  assert.equal(results.filter(x=>x.status==='fulfilled').length,1);
});
test('two stale tabs cannot claim one code or overwrite each other',async()=>{
  let saved=null;const storage={getItem:()=>saved,setItem:(key,value)=>{saved=value;}};
  const setup=createRepository(storage);setup.importStudents([{code:'TABS',name:'An',classId:'11T1'}]);
  const a=createRepository(storage),b=createRepository(storage),input={studentCode:'TABS',name:'An',password:'12345678'};
  const results=await Promise.allSettled([a.register({...input,email:'tab-a@example.com'}),b.register({...input,email:'tab-b@example.com'})]);
  assert.equal(results.filter(x=>x.status==='fulfilled').length,1);
  const loaded=createRepository(storage);assert.equal(loaded.users().filter(u=>u.studentCode==='TABS').length,1);
  const stale=results[0].status==='fulfilled'?b:a;
  assert.throws(()=>stale.importStudents([{code:'AFTER',name:'Bình',classId:'11T2'}]),/tab khác/);
});
test('admin can approve a rejected coded student again',async()=>{
  const r=createRepository(null);r.importStudents([{code:'RETRY',name:'An',classId:'11T1'}]);
  await r.register({studentCode:'RETRY',name:'An',email:'retry@example.com',password:'12345678'});
  const id=r.currentUser().id;r.rejectMember(id);r.approveMember(id);assert.equal(r.currentUser().membership,'approved');
});
test('older browser data is migrated without losing accounts or points',()=>{
  const source=createRepository(null).getState();delete source.students;source.users.forEach(u=>delete u.studentCode);
  const r=createRepository({getItem:()=>JSON.stringify(source),setItem:()=>{}});
  assert.equal(r.users().length,source.users.length);assert.equal(r.currentUser().points,120);assert.equal(r.students().length,4);
});
test('Excel supports Vietnamese columns, generated codes and roundtrip export by class',()=>{
  const wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet([['Mã học sinh','Họ và tên','Lớp'],['0000123','Nguyễn An','11T1'],['','Trần Bình','11T2']]),'Học sinh');
  const rows=parseStudentWorkbook(XLSX.write(wb,{type:'array',bookType:'xlsx'}));assert.equal(rows[0].code,'0000123');
  const roster=prepareStudentImport(rows,[]).students;
  const exported=makeStudentWorkbook(roster);assert.deepEqual(exported.SheetNames,['11T1','11T2']);
  const readback=parseStudentWorkbook(XLSX.write(exported,{type:'array',bookType:'xlsx'}));assert.equal(readback.length,2);assert.equal(readback[0].code,'0000123');
  const subset=makeStudentWorkbook(roster,'11T2');assert.deepEqual(subset.SheetNames,['11T2']);
});
test('Excel rejects missing headers, formulas and oversized sheets',()=>{
  const wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet([['Họ và tên'],['An']]),'Bad');
  assert.throws(()=>parseStudentWorkbook(XLSX.write(wb,{type:'array',bookType:'xlsx'})),/cột/);
  const sheet=XLSX.utils.aoa_to_sheet([['Mã học sinh','Tên','Lớp'],['X','An','11T1']]);sheet.A2={t:'s',f:'"X"',v:'X'};wb.Sheets.Bad=sheet;
  assert.throws(()=>parseStudentWorkbook(XLSX.write(wb,{type:'array',bookType:'xlsx'})),/công thức/);
  wb.Sheets.Bad=XLSX.utils.aoa_to_sheet([['Mã học sinh','Tên','Lớp']]);wb.Sheets.Bad['!ref']='A1:C5003';
  assert.throws(()=>parseStudentWorkbook(XLSX.write(wb,{type:'array',bookType:'xlsx'})),/5.000/);
});
