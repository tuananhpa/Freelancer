import {icon} from './icons.js';
import {escapeHTML as e} from './repository.js';
export function classPanel(ctx){
  const state=ctx.r.getState();
  return `<section class="panel spacious settings-panel class-panel" aria-labelledby="class-management-title"><h2 id="class-management-title">${icon('users')} Quản lý lớp</h2><p class="muted">Thêm hoặc đổi tên lớp. Khi nhập Excel, lớp chưa có được tạo tự động sau khi xác nhận.</p><form id="class-add-form"><label for="new-class-name">Tên lớp mới<input id="new-class-name" name="className" required maxlength="31" placeholder="Ví dụ: 11T10, 12A1"></label><p class="form-error" role="alert" tabindex="-1"></p><button class="button primary" type="submit">Thêm lớp</button></form><div class="class-management-list">${ctx.r.classes().map(id=>{
    const count=state.students.filter(s=>s.classId===id).length;
    const used=[state.users,state.students,state.history,state.transactions,state.adjustments].some(list=>list.some(row=>row.classId===id))||state.snapshots.some(s=>s.id===id);
    return `<div class="class-management-row"><div class="class-management-info"><strong>${e(id)}</strong><small>${count} học sinh trong danh sách</small></div><form class="class-rename-form" data-class-id="${e(id)}"><input name="className" value="${e(id)}" maxlength="31" required aria-label="Đổi tên lớp ${e(id)}"><button class="button secondary compact" type="submit">Lưu tên</button><p class="form-error" role="alert" tabindex="-1"></p></form><button class="button secondary compact" data-remove-class="${e(id)}" ${used?'disabled':''} aria-label="Xóa lớp ${e(id)}">Xóa</button></div>`;
  }).join('')}</div><p class="small-note">Tên lớp tối đa 31 ký tự. Chỉ xóa lớp chưa có học sinh, tài khoản hoặc dữ liệu điểm. Đổi tên giữ nguyên mã học sinh và điểm tích lũy.</p></section>`;
}
