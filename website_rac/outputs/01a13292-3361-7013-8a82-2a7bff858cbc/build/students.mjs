import fs from 'node:fs/promises';
import {Workbook,SpreadsheetFile} from 'file:///C:/Users/buiti/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/@oai/artifact-tool/dist/artifact_tool.mjs';
const out=new URL('../',import.meta.url).pathname.replace(/^\/([A-Za-z]:)/,'$1');
const wb=Workbook.create(),sheet=wb.worksheets.add('Danh sách'),guide=wb.worksheets.add('Hướng dẫn');
const surnames=['Nguyễn','Trần','Lê','Phạm','Hoàng','Huỳnh','Vũ','Đặng','Bùi','Đỗ'];
const names=['Minh Anh','Gia Bảo','Ngọc Châu','Tuấn Dũng','Khánh Hà','Quang Huy','Thảo Linh','Đức Minh','Thanh Phong','Bảo Vy'];
const rows=[];
for(let c=1;c<=10;c++)for(let n=0;n<10;n++)rows.push([`TEST-${String(rows.length+1).padStart(3,'0')}`,`${surnames[c-1]} ${names[n]}`,`11T${c}`]);
sheet.getRange('A1:C101').values=[['Mã học sinh','Họ và tên','Lớp'],...rows];
sheet.getRange('A1:C101').format.font={name:'Arial',size:11,color:'#193C29'};
sheet.getRange('A1:C101').format.rowHeight=24;
sheet.getRange('A1:C101').format.verticalAlignment='center';
sheet.getRange('A1:C1').format={fill:'#178037',font:{name:'Arial',size:11,bold:true,color:'#FFFFFF'},rowHeight:30,horizontalAlignment:'center'};
sheet.getRange('A1:A101').format.columnWidth=22;sheet.getRange('B1:B101').format.columnWidth=32;sheet.getRange('C1:C101').format.columnWidth=14;
sheet.getRange('A2:A101').setNumberFormat('@');sheet.getRange('C2:C101').format.horizontalAlignment='center';
for(let c=0;c<10;c++)if(c%2===0)sheet.getRange(`A${2+c*10}:C${11+c*10}`).format.fill='#EDF8EF';
sheet.freezePanes.freezeRows(1);sheet.showGridLines=false;sheet.tables.add('A1:C101',true,'DanhSachHocSinh');sheet.tabColor='#178037';
const notes=[
  ['Danh sách học sinh để kiểm tra'],
  ['100 học sinh giả, 10 lớp 11T1–11T10, mỗi lớp 10 học sinh.'],
  ['Mã TEST-001–TEST-100 là mã thử nghiệm duy nhất, không phải dữ liệu học sinh thật.'],
  ['Sheet Danh sách có đúng 3 cột: Mã học sinh, Họ và tên, Lớp.'],
  ['Có thể sửa tên/lớp/mã ở sheet Danh sách; để trống mã nếu muốn web tự tạo.'],
  ['Lưu ý: web hiện chỉ chấp nhận lớp 11T1, 11T2, 11T3.'],
  ['Import toàn bộ file sẽ bị từ chối do các lớp 11T4–11T10 chưa được hỗ trợ.'],
  ['Để thử ngay: giữ 30 dòng lớp 11T1–11T3 trong một bản sao, hoặc mở rộng danh sách lớp của web.'],
  ['Đăng ký bằng mã, đúng họ tên, email và mật khẩu; mỗi mã chỉ dùng một lần.'],
];
guide.getRange('A1:A9').values=notes;guide.getRange('A1:A9').format.font={name:'Arial',size:11,color:'#193C29'};guide.getRange('A1:A9').format.columnWidth=105;guide.getRange('A1:A9').format.rowHeight=30;guide.getRange('A1:A9').format.wrapText=true;guide.getRange('A1:A9').format.verticalAlignment='center';guide.getRange('A1').format.font={name:'Arial',size:15,bold:true,color:'#178037'};guide.getRange('A6:A8').format.fill='#FFF4DE';guide.showGridLines=false;guide.tabColor='#9AAD9E';
if(rows.length!==100||new Set(rows.map(r=>r[0])).size!==100)throw Error('Row/code count');
for(let c=1;c<=10;c++)if(rows.filter(r=>r[2]===`11T${c}`).length!==10)throw Error('Class count');
wb.recalculate();
const check=await wb.inspect({kind:'table',range:"'Danh sách'!A1:C12",include:'values',tableMaxRows:12,tableMaxCols:3,maxChars:1500});console.log(check.ndjson);
for(const [name,range,file] of [['Danh sách','A1:C16','data-preview.png'],['Hướng dẫn','A1:A9','guide-preview.png']]){
  const preview=await wb.render({sheetName:name,range,scale:1.5,format:'png'});await fs.writeFile(out+file,new Uint8Array(await preview.arrayBuffer()));
}
const xlsx=await SpreadsheetFile.exportXlsx(wb);await xlsx.save(out+'danh-sach-100-hoc-sinh-10-lop.xlsx');
console.log('Saved: 100 unique codes, 10 classes, 10 students each.');
