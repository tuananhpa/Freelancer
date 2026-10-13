import {initialClasses as seedClasses} from './config.js';
export const sortClasses=ids=>[...new Set(ids)].sort(new Intl.Collator('vi-VN',{numeric:true,sensitivity:'base'}).compare);
export function normalizeClass(value){
  const name=String(value??'').normalize('NFC').trim().replace(/\s+/g,' ').toLocaleUpperCase('vi-VN');
  if(!/^[\p{L}\p{N}][\p{L}\p{N} ._()-]{0,30}$/u.test(name))throw Error('Lớp cần tên hợp lệ từ 1–31 ký tự, ví dụ 11T10 hoặc 12A1.');
  return name;
}
export function migrateClasses(state){
  const references=[...state.users.map(u=>u.classId),...(state.students||[]).map(s=>s.classId),...state.snapshots.map(s=>s.id),...state.history.map(t=>t.classId),...state.transactions.map(t=>t.classId),...state.adjustments.map(t=>t.classId)].filter(Boolean);
  if(state.classIds!==undefined&&!Array.isArray(state.classIds))throw Error('class registry schema');
  state.classIds=sortClasses([...(state.classIds??seedClasses),...references].map(normalizeClass));return state;
}
