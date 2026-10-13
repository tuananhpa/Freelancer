import { projects } from './data.js';
export const DRAFT_KEY = 'portfolio.contact-draft.v1';
const normalize = value => String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d').replace(/Đ/g,'D').toLowerCase().trim();
export function getPublicProjects(data = projects) {
  return data.filter(p => p.status === 'published').map(p => {
    const {clientName, clientEmail, ...publicData} = p;
    return p.privateClient ? publicData : {...publicData,clientName};
  });
}
export function searchProjects({query = '',category = 'all'} = {}, data = projects) {
  const term = normalize(query);
  return getPublicProjects(data).filter(p => (category === 'all' || p.category === category) && normalize(`${p.title} ${p.subtitle ?? ''} ${p.description ?? ''}`).includes(term));
}
export function getProject(slug, data = projects) {return getPublicProjects(data).find(p => p.slug === slug);}
export function validateContact(data) {
  const errors = {};
  if (String(data.name ?? '').trim().length < 2) errors.name = 'Nhập tên của bạn (ít nhất 2 ký tự).';
  const contact = String(data.contact ?? '').trim();
  const phone = contact.replace(/[\s().-]/g,'');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact) && !/^\+?\d{9,15}$/.test(phone)) errors.contact = 'Nhập email hoặc số điện thoại hợp lệ.';
  if (!['Website','Web app','UI/UX','Khác'].includes(data.service)) errors.service = 'Chọn dịch vụ bạn quan tâm.';
  if (String(data.message ?? '').trim().length < 10) errors.message = 'Mô tả nhu cầu của bạn (ít nhất 10 ký tự).';
  return errors;
}
export function saveDraft(data, storage) {
  try { storage.setItem(DRAFT_KEY, JSON.stringify(data)); return {saved:true,sent:false}; }
  catch {return {saved:false,sent:false};}
}
export function loadDraft(storage) {
  try {const value=JSON.parse(storage.getItem(DRAFT_KEY)); return value && typeof value==='object' && !Array.isArray(value) ? value : null;}
  catch {return null;}
}
