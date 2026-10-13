import {normalizeClass,sortClasses,migrateClasses} from './class-registry.js';
export const MAX_STUDENTS=5000;
export const normalizeName=value=>String(value||'').normalize('NFC').trim().replace(/\s+/g,' ').toLocaleLowerCase('vi-VN');
export const normalizeCode=value=>String(value??'').trim().toUpperCase();
export function prepareStudentImport(rows,existing=[],knownClasses=[],sequence=0) {
  if(!Array.isArray(rows)||!rows.length)throw Error('Không có học sinh để nhập.');
  if(rows.length>MAX_STUDENTS)throw Error('Danh sách tối đa 5.000 học sinh.');
  const byCode=new Map(existing.map(s=>[s.code,s])),byName=new Set(existing.map(s=>`${normalizeName(s.name)}|${s.classId}`)),identities=new Map();
  const originalByCode=new Map(byCode);
  const addIdentity=s=>{if(s.sourceCode){const found=identities.get(s.sourceCode)||[];found.push(s);identities.set(s.sourceCode,found);}};existing.forEach(addIdentity);
  const result=[],errors=[];let skipped=0,nextSequence=Math.max(sequence,...existing.map(s=>/^HS\d{6}$/.test(s.code)?Number(s.code.slice(2)):0));
  for(let i=0;i<rows.length;i++) {
    const row=rows[i],line=row.line||`Dòng ${i+2}`;
    const name=String(row.name??'').normalize('NFC').trim().replace(/\s+/g,' ');let classId;
    const sourceCode=normalizeCode(row.sourceCode??row.code);
    if(name.length<2||name.length>60){errors.push(`${line}: Họ tên cần từ 2 đến 60 ký tự.`);continue;}
    try{classId=normalizeClass(row.classId);}catch(error){errors.push(`${line}: ${error.message}`);continue;}
    if(sourceCode&&!/^[A-Z0-9][A-Z0-9_-]{2,31}$/.test(sourceCode)){errors.push(`${line}: Mã trong file cần 3–32 ký tự, chỉ gồm chữ, số, dấu - hoặc _.`);continue;}
    const candidates=[...new Set([originalByCode.get(normalizeCode(row.code)),originalByCode.get(sourceCode),...(identities.get(sourceCode)||[])].filter(Boolean))];
    if(candidates.length){
      const duplicate=candidates.find(s=>normalizeName(s.name)===normalizeName(name)&&s.classId===classId);
      if(duplicate){result.push({...duplicate,importStatus:'skip'});skipped++;}
      else errors.push(`${line}: Mã ${sourceCode||row.code} bị trùng, đã thuộc một học sinh hoặc lớp khác.`);
      continue;
    }
    if(!sourceCode&&byName.has(`${normalizeName(name)}|${classId}`)){errors.push(`${line}: Tên này đã có trong lớp; hãy nhập mã riêng để phân biệt hoặc sử dụng mã đã có.`);continue;}
    let code;do{nextSequence++;code='HS'+String(nextSequence).padStart(6,'0');}while(byCode.has(code));
    if(nextSequence>999999)throw Error('Đã hết dãy mã HS sáu chữ số.');
    const student={code,sourceCode,name,classId,userId:null};byCode.set(code,student);addIdentity(student);byName.add(`${normalizeName(name)}|${classId}`);result.push({...student,importStatus:'new'});
  }
  if(errors.length)throw Error(errors.slice(0,10).join('\n')+(errors.length>10?`\n… và ${errors.length-10} dòng lỗi khác.`:''));
  if(existing.length+result.length-skipped>MAX_STUDENTS)throw Error('Danh sách tối đa 5.000 học sinh.');
  return {students:result,added:result.length-skipped,skipped,nextSequence,newClasses:sortClasses(result.map(s=>s.classId).filter(id=>!knownClasses.includes(id)))};
}
export function migrateStudentRoster(state) {
  if(state.students===undefined){
    state.students=state.users.filter(u=>u.classId).map((u,i)=>{
      u.studentCode=u.studentCode||`HS${String(i+1).padStart(6,'0')}`;
      return {code:u.studentCode,name:u.name,classId:u.classId,userId:u.id};
    });
  }
  if(!Array.isArray(state.students)||state.students.some(s=>!s?.code||typeof s.name!=='string'||!s.classId))throw Error('roster schema');
  state.studentSequence=Math.max(Number.isSafeInteger(state.studentSequence)?state.studentSequence:0,...state.students.map(s=>/^HS\d{6}$/.test(s.code)?Number(s.code.slice(2)):0));
  return migrateClasses(state);
}
