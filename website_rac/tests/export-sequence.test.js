import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as XLSX from 'xlsx';
import {createRepository} from '../src/repository.js';
import {makeStudentWorkbook,parseStudentWorkbook} from '../src/student-excel.js';
test('all classes export every student in one visible sheet',()=>{
  const students=Array.from({length:100},(_,i)=>({code:`HS${String(i+1).padStart(6,'0')}`,name:`Học sinh ${i+1}`,classId:`11T${Math.floor(i/10)+1}`}));
  const wb=makeStudentWorkbook(students,'all');assert.deepEqual(wb.SheetNames,['Danh sách']);
  const rows=XLSX.utils.sheet_to_json(wb.Sheets['Danh sách']);assert.equal(rows.length,100);assert.equal(rows[99]['Mã học sinh'],'HS000100');
  const parsed=parseStudentWorkbook(XLSX.write(wb,{type:'array',bookType:'xlsx'}));assert.equal(parsed.length,100);
  assert.equal(XLSX.utils.sheet_to_json(makeStudentWorkbook(students,'11T10').Sheets['11T10']).length,10);
});
test('new students always get sequential HS codes even when source Excel contains other IDs',()=>{
  const r=createRepository(null),preview=r.previewStudents([{code:'CUSTOM-01',name:'An',classId:'11T1'},{name:'Bình',classId:'11T2'}]);
  assert.deepEqual(preview.students.map(s=>s.code),['HS000005','HS000006']);
  r.importStudents(preview.students);const next=r.importStudents([{code:'CUSTOM-02',name:'Châu',classId:'11T3'}]);
  assert.equal(r.students().find(s=>s.name==='Châu').code,'HS000007');assert.equal(next.added,1);
  assert.equal(r.importStudents([{code:'CUSTOM-01',name:'An',classId:'11T1'}]).skipped,1);
});
test('counter persists across reload, preview and failed imports do not consume IDs',()=>{
  let saved=null;const storage={getItem:()=>saved,setItem:(k,v)=>{saved=v;}};
  const r=createRepository(storage);r.previewStudents([{name:'An',classId:'11T1'}]);
  assert.throws(()=>r.importStudents([{name:'An',classId:'11T1'},{name:'Bình',classId:''}]),/Lớp/);
  r.importStudents([{name:'An',classId:'11T1'}]);
  const loaded=createRepository(storage);assert.equal(loaded.previewStudents([{name:'Bình',classId:'11T2'}]).students[0].code,'HS000006');
});
test('source IDs resembling a future HS number do not break preview confirmation',()=>{
  const r=createRepository(null),preview=r.previewStudents([{code:'HS000006',name:'An',classId:'11T1'},{name:'Bình',classId:'11T2'}]);
  r.importStudents(preview.students);assert.deepEqual(r.students().filter(s=>['An','Bình'].includes(s.name)).map(s=>s.code),['HS000005','HS000006']);
});
