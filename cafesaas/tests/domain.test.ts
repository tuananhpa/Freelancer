import {describe,it,expect} from 'vitest';
import {calculateLine,totalCart,canTransition,buildVietQrUrl,dailyReport,csvCell,allocateQuantity,createVietQrPayload} from '../packages/shared/src/domain';
const product={id:'c',name:'Cà phê sữa',price:35000,category:'coffee',active:true,available:true,photo:0,variants:[{id:'m',name:'M',delta:0},{id:'l',name:'L',delta:10000}],options:[{id:'pearl',name:'Trân châu',price:5000}]};
describe('pricing and invariants',()=>{
 it('prices options and quantity using integer VND',()=>{expect(calculateLine(product,{productId:'c',quantity:2,variantId:'l',optionIds:['pearl'],note:''}).total).toBe(100000)});
 it('totals the selected A basket',()=>expect(totalCart([{total:70000},{total:45000}])).toBe(115000));
 it('rejects fractional quantity',()=>expect(()=>calculateLine(product,{productId:'c',quantity:1.5,variantId:'m',optionIds:[],note:''})).toThrow());
 it('rejects option from another product',()=>expect(()=>calculateLine(product,{productId:'c',quantity:1,variantId:'m',optionIds:['foreign'],note:''})).toThrow());
 it('rejects unavailable products',()=>expect(()=>calculateLine({...product,available:false},{productId:'c',quantity:1,variantId:'m',optionIds:[],note:''})).toThrow());
 it('rejects skipped and terminal state transitions',()=>{expect(canTransition('pending','accepted')).toBe(true);expect(canTransition('pending','served')).toBe(false);expect(canTransition('served','pending')).toBe(false)});
 it('includes exact amount and preserves account leading zero',()=>{const url=new URL(buildVietQrUrl({bin:'970436',account:'00123456789',holder:'NGUYEN A'},115000,'CF ABC123'));expect(url.pathname).toContain('00123456789');expect(url.searchParams.get('amount')).toBe('115000');expect(url.searchParams.get('addInfo')).toBe('CF ABC123')});
 it('refuses QR without beneficiary or valid due',()=>{expect(()=>buildVietQrUrl({bin:'970436',account:'',holder:''},115000,'CF A')).toThrow();expect(()=>buildVietQrUrl({bin:'970436',account:'12345678',holder:'A'},0,'CF A')).toThrow()});
 it('filters collections by local date and branch',()=>{const data=[{branchId:'b1',at:'2026-10-13T18:00:00Z',kind:'collection',method:'cash',amount:115000},{branchId:'b2',at:'2026-10-13T18:00:00Z',kind:'collection',method:'transfer',amount:90000},{branchId:'b1',at:'2026-10-14T18:00:00Z',kind:'collection',method:'cash',amount:20000},{branchId:'b1',at:'2026-10-14T03:00:00Z',kind:'refund',method:'cash',amount:35000}];expect(dailyReport(data,'2026-10-14',['b1']).net).toBe(80000)});
 it('neutralizes spreadsheet formulas',()=>{expect(csvCell('=SUM(A1)')).toBe('"\'=SUM(A1)"');expect(csvCell('safe')).toBe('"safe"')});
 it('quantity allocation conserves item units',()=>{expect(allocateQuantity(3,1)).toEqual([1,2]);expect(()=>allocateQuantity(2,3)).toThrow()});
});

it('encodes a known VietQR vector including CRC',()=>expect(createVietQrPayload({bin:'970415',account:'0011001932418',holder:'TEST'},120000,'ung ho lu lut')).toBe('00020101021238570010A00000072701270006970415011300110019324180208QRIBFTTA530370454061200005802VN62170813ung ho lu lut6304C15C'));
