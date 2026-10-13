import * as XLSX from 'xlsx';
import {MAX_STUDENTS} from './roster.js';
import {sortClasses} from './class-registry.js';
const key=value=>String(value??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/gi,'d').toLowerCase().replace(/[^a-z0-9]/g,'');
const aliases={code:['mahocsinh','mahs','masohocsinh','studentcode','code'],name:['hovaten','hoten','ten','name','fullname'],classId:['lop','lophoc','class','classid']};
export function parseStudentWorkbook(bytes) {
  if(bytes.byteLength>10*1024*1024)throw Error('File Excel tối đa 10 MB.');
  let workbook;try{workbook=XLSX.read(bytes,{type:'array',cellFormula:true,sheetRows:MAX_STUDENTS+2});}catch{throw Error('Không đọc được file Excel. Hãy chọn file .xlsx hoặc .xls hợp lệ.');}
  const rows=[];
  for(const sheetName of workbook.SheetNames){
    const sheet=workbook.Sheets[sheetName];
    const origin=sheet['!ref']?XLSX.utils.decode_range(sheet['!ref']).s:{r:0,c:0};
    if(sheet['!fullref']&&XLSX.utils.decode_range(sheet['!fullref']).e.r>MAX_STUDENTS)throw Error('Danh sách tối đa 5.000 học sinh.');
    const grid=XLSX.utils.sheet_to_json(sheet,{header:1,raw:false,defval:'',blankrows:true});
    const headerIndex=grid.findIndex(row=>row.some(v=>String(v).trim()));if(headerIndex<0)continue;
    const header=grid[headerIndex].map(key),columns={};for(const field of Object.keys(aliases))columns[field]=header.findIndex(h=>aliases[field].includes(h));
    if(columns.name<0||columns.classId<0){
      if(key(sheetName)==='huongdan')continue;
      throw Error(`Sheet ${sheetName}: cần cột Họ và tên và Lớp. Mã học sinh có thể để trống.`);
    }
    for(let i=headerIndex+1;i<grid.length;i++){
      const values=grid[i];if(!values.some(v=>String(v).trim()))continue;
      const row={line:`${sheetName}, dòng ${origin.r+i+1}`};
      for(const [field,col] of Object.entries(columns)){
        if(col>=0&&sheet[XLSX.utils.encode_cell({r:origin.r+i,c:origin.c+col})]?.f)throw Error(`${row.line}: dùng giá trị văn bản, không dùng công thức trong cột học sinh.`);
        row[field]=col<0?'':String(values[col]??'').trim();
      }
      rows.push(row);if(rows.length>MAX_STUDENTS)throw Error('Danh sách tối đa 5.000 học sinh.');
    }
  }
  if(!rows.length)throw Error('File Excel chưa có danh sách học sinh.');return rows;
}
function appendSheet(wb,rows,name){
  const sheet=XLSX.utils.aoa_to_sheet([['Mã học sinh','Họ và tên','Lớp'],...rows.map(s=>[s.code||'',s.name,s.classId])]);
  sheet['!cols']=[{wch:22},{wch:36},{wch:14}];sheet['!autofilter']={ref:sheet['!ref']};
  XLSX.utils.book_append_sheet(wb,sheet,name);
}
export function makeStudentWorkbook(students,classId='all') {
  const rows=students.filter(s=>classId==='all'||s.classId===classId);if(!rows.length)throw Error('Không có học sinh trong lớp để xuất.');
  const wb=XLSX.utils.book_new();for(const id of sortClasses(rows.map(s=>s.classId)))appendSheet(wb,rows.filter(s=>s.classId===id),id);
  wb.Props={Title:'Danh sách mã học sinh',Author:'Trường học xanh'};return wb;
}
export function templateWorkbook() {
  const wb=XLSX.utils.book_new();appendSheet(wb,[{code:'',name:'Nguyễn Văn A',classId:'11T1'},{code:'',name:'Trần Thị B',classId:'11T2'}],'Danh sách học sinh');
  const guide=XLSX.utils.aoa_to_sheet([['Hướng dẫn nhập danh sách'],['Sửa hoặc xóa hai dòng ví dụ trước khi nhập danh sách thật.'],['Điền Họ và tên và Lớp. Lớp chưa có được tự tạo khi xác nhận nhập.'],['Mã học sinh tùy chọn. Để trống để website tự tạo mã.'],['Nếu điền mã, định dạng cột là Text để giữ số 0 ở đầu.'],['Mỗi mã chỉ đăng ký được một tài khoản. Học sinh phải nhập đúng họ tên.']]);guide['!cols']=[{wch:95}];XLSX.utils.book_append_sheet(wb,guide,'Hướng dẫn');return wb;
}
export function downloadWorkbook(wb,filename){XLSX.writeFile(wb,filename,{bookType:'xlsx'});}
