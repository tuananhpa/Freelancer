import {normalizeClass,sortClasses,migrateClasses} from './class-registry.js';
export const MAX_STUDENTS=5000;
export const normalizeName=value=>String(value||'').normalize('NFC').trim().replace(/\s+/g,' ').toLocaleLowerCase('vi-VN');
export const normalizeCode=value=>String(value??'').trim().toUpperCase();
export function prepareStudentImport(rows,existing=[],knownClasses=[]) {
  if(!Array.isArray(rows)||!rows.length)throw Error('Không có học sinh để nhập.');
  if(rows.length>MAX_STUDENTS)throw Error('Danh sách tối đa 5.000 học sinh.');
  const byCode=new Map(existing.map(s=>[s.code,s])),byName=new Set(existing.map(s=>`${normalizeName(s.name)}|${s.classId}`));
  const result=[],errors=[];let skipped=0;
  for(let i=0;i<rows.length;i++) {
    const row=rows[i],line=row.line||`Dòng ${i+2}`;
    const name=String(row.name??'').normalize('NFC').trim().replace(/\s+/g,' ');let classId;
    let code=normalizeCode(row.code);
    if(name.length<2||name.length>60){errors.push(`${line}: Họ tên cần từ 2 đến 60 ký tự.`);continue;}
    try{classId=normalizeClass(row.classId);}catch(error){errors.push(`${line}: ${error.message}`);continue;}
    if(code&&!/^[A-Z0-9][A-Z0-9_-]{2,31}$/.test(code)){errors.push(`${line}: Mã học sinh cần 3–32 ký tự, chỉ gồm chữ, số, dấu - hoặc _.`);continue;}
    if(!code){
      if(byName.has(`${normalizeName(name)}|${classId}`)){errors.push(`${line}: Tên này đã có trong lớp; hãy nhập mã riêng để phân biệt hoặc sử dụng mã đã có.`);continue;}
      do{code='HS'+crypto.randomUUID().replace(/-/g,'').slice(0,10).toUpperCase();}while(byCode.has(code));
    }
    const duplicate=byCode.get(code);
    if(duplicate){
      if(normalizeName(duplicate.name)===normalizeName(name)&&duplicate.classId===classId){result.push({...duplicate,importStatus:'skip'});skipped++;}
      else errors.push(`${line}: Mã ${code} bị trùng, đã thuộc một học sinh hoặc lớp khác.`);
      continue;
    }
    const student={code,name,classId,userId:null};byCode.set(code,student);byName.add(`${normalizeName(name)}|${classId}`);result.push({...student,importStatus:'new'});
  }
  if(errors.length)throw Error(errors.slice(0,10).join('\n')+(errors.length>10?`\n… và ${errors.length-10} dòng lỗi khác.`:''));
  if(existing.length+result.length-skipped>MAX_STUDENTS)throw Error('Danh sách tối đa 5.000 học sinh.');
  return {students:result,added:result.length-skipped,skipped,newClasses:sortClasses(result.map(s=>s.classId).filter(id=>!knownClasses.includes(id)))};
}
export function migrateStudentRoster(state) {
  if(state.students===undefined){
    state.students=state.users.filter(u=>u.classId).map((u,i)=>{
      u.studentCode=u.studentCode||`HS${String(i+1).padStart(6,'0')}`;
      return {code:u.studentCode,name:u.name,classId:u.classId,userId:u.id};
    });
  }
  if(!Array.isArray(state.students)||state.students.some(s=>!s?.code||typeof s.name!=='string'||!s.classId))throw Error('roster schema');
  return migrateClasses(state);
}
