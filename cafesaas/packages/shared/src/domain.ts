import type {Product,CartLine,PricedLine,BankDetails,Transaction} from './types';
export const stateLabels:Record<string,string>={pending:'Chờ xác nhận',accepted:'Đã nhận',preparing:'Đang pha chế',ready:'Sẵn sàng',served:'Đã phục vụ',completed:'Hoàn tất',cancelled:'Đã hủy',available:'Trống',occupied:'Có khách',ordering:'Đang gọi món',waiting_payment:'Chờ thanh toán',cleaning:'Đang dọn'};
export const roleLabels:Record<string,string>={owner:'Chủ quán',manager:'Quản lý',cashier:'Thu ngân',waiter:'Phục vụ',barista:'Pha chế',platform:'Super Admin'};
export const money=(n:number)=>new Intl.NumberFormat('vi-VN').format(n)+'đ';
export function localDate(at:string|Date=new Date(),timezone='Asia/Ho_Chi_Minh'){return new Intl.DateTimeFormat('en-CA',{timeZone:timezone,year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(at))}
export function localTime(at:string){return new Intl.DateTimeFormat('vi-VN',{timeZone:'Asia/Ho_Chi_Minh',hour:'2-digit',minute:'2-digit'}).format(new Date(at))}
export function assertMoney(value:number,allowZero=true){if(!Number.isSafeInteger(value)||value<0||(!allowZero&&value===0)||value>1000000000)throw new Error('Số tiền phải là số nguyên hợp lệ trong khoảng cho phép.')}
export function calculateLine(p:Product,l:CartLine):PricedLine{
 if(!p.active||!p.available)throw new Error('Món đang ngừng bán hoặc hết hàng.');
 if(!Number.isInteger(l.quantity)||l.quantity<1||l.quantity>99)throw new Error('Số lượng phải từ 1 đến 99.');
 const variant=p.variants.find(v=>v.id===l.variantId);if(!variant)throw new Error('Size không hợp lệ.');
 if(new Set(l.optionIds).size!==l.optionIds.length)throw new Error('Topping bị trùng.');
 const options=l.optionIds.map(id=>{const o=p.options.find(o=>o.id===id);if(!o)throw new Error('Topping không hợp lệ.');return o});
 const unitPrice=p.price+variant.delta+options.reduce((n,o)=>n+o.price,0);assertMoney(unitPrice);assertMoney(unitPrice*l.quantity);
 return {...l,id:crypto.randomUUID(),name:p.name,variant:variant.name,optionNames:options.map(o=>o.name),unitPrice,total:unitPrice*l.quantity,photo:p.photo,image:p.image,note:l.note.slice(0,500)};
}
export function totalCart(lines:{total:number}[]){const total=lines.reduce((n,l)=>n+l.total,0);assertMoney(total);return total}
const transitions:Record<string,string[]>={pending:['accepted','cancelled'],accepted:['preparing','cancelled'],preparing:['ready','cancelled'],ready:['served'],served:['completed'],completed:[],cancelled:[]};
export function canTransition(from:string,to:string){return transitions[from]?.includes(to)??false}
function validateBank(bank:BankDetails,due:number,ref:string){if(!/^\d{6}$/.test(bank.bin)||!/^\d{6,19}$/.test(bank.account)||!bank.holder.trim())throw new Error('Cần ngân hàng, số tài khoản 6–19 chữ số và tên chủ tài khoản.');assertMoney(due,false);if(!/^[A-Za-z0-9 ]{1,25}$/.test(ref))throw new Error('Nội dung chuyển khoản không hợp lệ.')}
export function buildVietQrUrl(bank:BankDetails,due:number,ref:string){validateBank(bank,due,ref);const url=new URL('https://img.vietqr.io/image/'+bank.bin+'-'+bank.account+'-qr_only.svg');url.search=new URLSearchParams({amount:String(due),addInfo:ref,accountName:bank.holder}).toString();return url.toString()}
function tlv(id:string,value:string){if(value.length>99)throw new Error('QR field too long');return id+String(value.length).padStart(2,'0')+value}
export function createVietQrPayload(bank:BankDetails,due:number,ref:string){
 validateBank(bank,due,ref);
 const account=tlv('00',bank.bin)+tlv('01',bank.account);
 const merchant=tlv('00','A000000727')+tlv('01',account)+tlv('02','QRIBFTTA');
 const raw=tlv('00','01')+tlv('01','12')+tlv('38',merchant)+tlv('53','704')+tlv('54',String(due))+tlv('58','VN')+tlv('62',tlv('08',ref))+'6304';
 let crc=0xffff;for(const b of new TextEncoder().encode(raw)){crc^=b<<8;for(let j=0;j<8;j++)crc=(crc&0x8000)?((crc<<1)^0x1021)&0xffff:(crc<<1)&0xffff}
 return raw+crc.toString(16).toUpperCase().padStart(4,'0');
}
export function dailyReport(rows:Pick<Transaction,'branchId'|'at'|'kind'|'method'|'amount'>[],date:string,branches:string[]){
 const selected=rows.filter(t=>branches.includes(t.branchId)&&localDate(t.at)===date);
 const cash=selected.filter(t=>t.kind==='collection'&&t.method==='cash').reduce((n,t)=>n+t.amount,0);
 const transfer=selected.filter(t=>t.kind==='collection'&&t.method==='transfer').reduce((n,t)=>n+t.amount,0);
 const refunds=selected.filter(t=>t.kind==='refund').reduce((n,t)=>n+t.amount,0);
 return {cash,transfer,refunds,net:cash+transfer-refunds};
}
export function csvCell(value:string|number){let text=String(value);if(/^[\s]*[=+\-@]/.test(text))text="'"+text;return '"'+text.replaceAll('"','""')+'"'}
export function allocateQuantity(total:number,selected:number){if(!Number.isInteger(selected)||selected<0||selected>total)throw new Error('Số lượng tách không hợp lệ.');return [selected,total-selected]}

export function reportingBranches(branches:import('./types').Branch[],selection:string){return branches.filter(b=>selection==='all'||b.id===selection)}
export function canEditEntity(role:string,entity:string){return entity==='banks'?role==='owner':['owner','manager'].includes(role)}
export function connectionLabel(online:boolean){return online?'Đã kết nối':'Mất kết nối'}
