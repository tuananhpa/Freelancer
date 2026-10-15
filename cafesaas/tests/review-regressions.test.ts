import {describe,it,expect} from 'vitest';
import {LocalRepository} from '../apps/web/src/data/repository';
import {reportingBranches,canEditEntity,connectionLabel} from '../packages/shared/src/domain';
class MemoryStorage{data=new Map<string,string>();getItem(k:string){return this.data.get(k)??null}setItem(k:string,v:string){this.data.set(k,v)}}
const line=(quantity=2)=>({productId:'coffee',quantity,variantId:'m',optionIds:[],note:''});
const fresh=()=>new LocalRepository(new MemoryStorage(),'review');
describe('final review regressions',()=>{
it('rejects stale-tab mutation instead of losing a newly saved order',()=>{const storage=new MemoryStorage();const a=new LocalRepository(storage,'same');const b=new LocalRepository(storage,'same');const order=a.createOrder('b1','b1-08',[line()],'pos','k');expect(()=>b.upsert('products',{...b.state.products[0],name:'changed'})).toThrow(/tab/i);expect(JSON.parse(storage.getItem(a.key)!).orders.some((o:any)=>o.id===order.id)).toBe(true)});
it('retains per-item ready state through split and serves the new bill',()=>{const r=fresh();const order=r.createOrder('b1','b1-08',[line()],'pos','k');r.transition(order.id,'preparing');r.transition(order.id,'ready');const child=r.splitOrder(order.id,[1]);expect(child.itemStates?.[child.lines[0].id]).toBe('ready');r.transitionItem(child.id,child.lines[0].id,'served');expect(r.state.orders.find(o=>o.id===child.id)?.state).toBe('served')});
it('recomputes merged fulfillment so queued items remain visible to KDS',()=>{const r=fresh();const a=r.createOrder('b1','b1-08',[line(1)],'pos','a');const b=r.createOrder('b1','b1-08',[line(1)],'pos','b');r.transition(a.id,'preparing');r.transition(a.id,'ready');r.transition(a.id,'served');r.mergeBills(a.id,b.id);const merged=r.state.orders.find(o=>o.id===a.id)!;expect(['accepted','preparing']).toContain(merged.state);expect(merged.itemStates?.[b.lines[0].id]).toBe('queued');expect(merged.itemStates?.[a.lines[0].id]).toBe('served')});
it('splits zero-price items without NaN totals',()=>{const r=fresh();r.upsert('products',{...r.state.products[0],price:0});const o=r.createOrder('b1','b1-08',[line()],'pos','k');const child=r.splitOrder(o.id,[1]);expect(child.total).toBe(0);expect(r.state.orders.find(x=>x.id===o.id)?.total).toBe(0)});
it('allocates unique bill numbers after repeated splits',()=>{const r=fresh();const o=r.createOrder('b1','b1-08',[line(3)],'pos','k');const a=r.splitOrder(o.id,[1]);const b=r.splitOrder(o.id,[1]);expect(a.number).not.toBe(b.number)});
it('includes archived branches in historical reports',()=>{const r=fresh();r.archive('branches','b2');expect(reportingBranches(r.state.branches,'all').map(b=>b.id)).toContain('b2');expect(reportingBranches(r.state.branches,'b2')).toHaveLength(1)});
it('matches bank editing controls to owner-only permission',()=>{expect(canEditEntity('owner','banks')).toBe(true);expect(canEditEntity('manager','banks')).toBe(false);expect(canEditEntity('manager','products')).toBe(true)});
it('reports offline truthfully',()=>{expect(connectionLabel(false)).toBe('Mất kết nối');expect(connectionLabel(true)).toBe('Đã kết nối')});
});
