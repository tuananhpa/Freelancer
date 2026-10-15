import {defineStore} from 'pinia';
import {computed,ref,markRaw} from 'vue';
import {LocalRepository,type Entity} from '../data/repository';
import {calculateLine,totalCart,roleLabels,canEditEntity} from '../../../../packages/shared/src/domain';
import type {CartLine,Order,Role} from '../../../../packages/shared/src/types';
export const useCoffee=defineStore('coffee',()=>{
 const repo=markRaw(new LocalRepository(localStorage,'coffee'));
 const state=ref(repo.state);const branchId=ref('b1');const role=ref<Role>('owner');
 const cart=ref<CartLine[]>([{productId:'coffee',quantity:2,variantId:'m',optionIds:[],note:''},{productId:'peach',quantity:1,variantId:'m',optionIds:[],note:'Ít đá'}]);
 const tableId=ref('b1-08');const toast=ref('');const toastType=ref('info');let timer:ReturnType<typeof setTimeout>;
 const branch=computed(()=>state.value.branches.find(b=>b.id===branchId.value)!);
 const tables=computed(()=>state.value.tables.filter(t=>t.branchId===branchId.value&&t.active));
 const orders=computed(()=>state.value.orders.filter(o=>o.branchId===branchId.value));
 const priced=computed(()=>cart.value.map(l=>{const p=state.value.products.find(p=>p.id===l.productId)!;try{return calculateLine(p,l)}catch{return {...l,id:l.productId,name:p?.name??'Món không còn bán',variant:'',optionNames:[],unitPrice:0,total:0,photo:p?.photo??0}}}));
 const total=computed(()=>totalCart(priced.value));
 const canManage=computed(()=>['owner','manager'].includes(role.value));
 const canCollect=computed(()=>['owner','manager','cashier'].includes(role.value));
 function notify(text:string,type='info'){toast.value=text;toastType.value=type;clearTimeout(timer);timer=setTimeout(()=>toast.value='',5000)}
 function run<T>(fn:()=>T,message='Đã lưu thay đổi trên trình duyệt.'):T|undefined{try{if(!navigator.onLine)throw new Error('Đang mất mạng. Vui lòng kết nối trước khi lưu.');const result=fn();state.value=repo.state;if(message)notify(message);return result}catch(e){notify((e as Error).message,'error');return undefined}}
 function changeBranch(id:string){branchId.value=id;tableId.value=state.value.tables.find(t=>t.branchId===id&&t.active)?.id??'takeaway';cart.value=[]}
 function addLine(line:CartLine){const p=state.value.products.find(p=>p.id===line.productId);if(!p)return;try{calculateLine(p,line);const existing=cart.value.find(l=>l.productId===line.productId&&l.variantId===line.variantId&&JSON.stringify(l.optionIds)===JSON.stringify(line.optionIds)&&l.note===line.note);if(existing){if(existing.quantity+line.quantity>99)throw new Error('Số lượng tối đa 99.');existing.quantity+=line.quantity}else cart.value.push({...line,optionIds:[...line.optionIds]})}catch(e){notify((e as Error).message,'error')}}
 function submit(source:Order['source']='pos',key=crypto.randomUUID()){return run(()=>{const o=repo.createOrder(branchId.value,tableId.value,cart.value,source,key);cart.value=[];return o},source==='qr'?'Đơn đã lưu trên trình duyệt, chưa gửi tới quán.':'Đã lưu đơn trên trình duyệt.')}
 function upsert(entity:Entity,data:any){if(!canEditEntity(role.value,entity)){notify('Vai trò này không có quyền chỉnh sửa.','error');return}return run(()=>repo.upsert(entity,data))}
 function archive(entity:Entity,id:string){if(!canEditEntity(role.value,entity))return;return run(()=>repo.archive(entity,id))}
 return {repo,state,branchId,branch,role,roleLabels,cart,tableId,tables,orders,priced,total,toast,toastType,canManage,canCollect,notify,run,changeBranch,addLine,submit,upsert,archive};
});
