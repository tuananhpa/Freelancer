import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRepository} from '../src/repository.js';
import {parseStudentWorkbook,makeStudentWorkbook} from '../src/student-excel.js';
import * as XLSX from 'xlsx';
test('Excel preview lists new classes without saving; confirmation creates them atomically',()=>{
  const r=createRepository(null),rows=[{code:'DYNAMIC-1',name:'Nguyễn An',classId:'11T10'},{code:'DYNAMIC-2',name:'Trần Bình',classId:' 10a1 '}];
  const preview=r.previewStudents(rows);assert.deepEqual(preview.newClasses,['10A1','11T10']);assert.ok(!r.classes().includes('11T10'));
  r.importStudents(preview.students);assert.ok(r.classes().includes('11T10'));assert.ok(r.classes().includes('10A1'));
  assert.equal(r.rankings('all').find(c=>c.id==='11T10').points,0);
  const before=r.classes();assert.throws(()=>r.importStudents([{code:'VALID-NEW',name:'An',classId:'12A8'},{code:'BAD-NEW',name:'Bình',classId:''}]),/Lớp/);assert.deepEqual(r.classes(),before);
});
test('admin adds, renames, and removes only unused classes',()=>{
  const r=createRepository(null);r.addClass('12a1');assert.ok(r.classes().includes('12A1'));assert.throws(()=>r.addClass('12A1'),/đã/);
  r.importStudents([{code:'NEWCLASS',name:'An',classId:'12A1'}]);r.renameClass('12A1','12A2');assert.equal(r.students().find(s=>s.sourceCode==='NEWCLASS').classId,'12A2');assert.ok(!r.classes().includes('12A1'));
  assert.throws(()=>r.removeClass('12A2'),/học sinh|dữ liệu/);assert.throws(()=>r.renameClass('12A2','11T1'),/đã/);
  r.addClass('Lớp thử');r.removeClass('LỚP THỬ');assert.ok(!r.classes().includes('LỚP THỬ'));
});
test('class names similar to guide sheet never lose students in Excel roundtrip',()=>{
  const r=createRepository(null);r.importStudents([{code:'GUIDE-A',name:'Nguyễn An',classId:'HUONG DAN'},{code:'GUIDE-B',name:'Trần Bình',classId:'HƯỚNG-DẪN'}]);
  const rows=r.students().filter(s=>s.sourceCode?.startsWith('GUIDE-'));
  const wb=makeStudentWorkbook(rows),parsed=parseStudentWorkbook(XLSX.write(wb,{type:'array',bookType:'xlsx'}));assert.equal(parsed.length,2);assert.deepEqual(parsed.map(s=>s.code).sort(),rows.map(s=>s.code).sort());
});
test('rename preserves memberships, past transactions, class totals and codes',()=>{
  const r=createRepository(null);const before=r.rankings('all').find(c=>c.id==='11T1');
  r.recordDeposit({id:'before-rename',userId:'student-1',binId:'R01',type:'plastic',confirmed:true});
  r.renameClass('11T1','11X1');assert.equal(r.currentUser().classId,'11X1');assert.equal(r.history()[0].classId,'11X1');
  assert.equal(r.rankings('all').find(c=>c.id==='11X1').points,before.points+10);assert.equal(r.students().find(s=>s.userId==='student-1').classId,'11X1');
});
test('existing 100-student file imports all ten classes and registration uses new class',async()=>{
  const bytes=fs.readFileSync('outputs/01a13292-3361-7013-8a82-2a7bff858cbc/danh-sach-100-hoc-sinh-10-lop.xlsx');
  const r=createRepository(null),preview=r.previewStudents(parseStudentWorkbook(bytes));assert.equal(preview.added,100);assert.equal(preview.newClasses.length,7);
  r.importStudents(preview.students);assert.equal(r.classes().length,10);assert.equal(r.students().filter(s=>s.sourceCode?.startsWith('TEST-')).length,100);
  r.updateSettings({approvalMode:'instant'});await r.register({studentCode:r.students().find(s=>s.sourceCode==='TEST-100').code,name:'Đỗ Bảo Vy',email:'ten-classes@example.com',password:'12345678'});assert.equal(r.currentUser().classId,'11T10');
});
