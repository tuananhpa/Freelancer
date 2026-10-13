export const STORAGE_KEY = 'school-green.frontend.v1';
export const defaults = {
  schoolName: '[Tên trường]', productName: '[Tên sản phẩm]', schoolImage: '', logoImage: '',
  points: { plastic: 10, metal: 20 }, approvalMode: 'required',
  waitingTitle: 'Đang chờ kết quả bỏ rác',
  waitingDescription: 'Hãy bỏ nhựa hoặc kim loại vào thùng. Điểm chỉ được cộng khi xác nhận rác đã vào thùng.',
  footerText: 'Lần sau, quét QR trên thùng để bắt đầu phiên mới.',
};
// Initial demo classes; runtime classes are managed in repository state.
export const initialClasses = ['11T1', '11T2', '11T3'];
export const wasteTypes = { plastic: 'Nhựa', metal: 'Kim loại' };
export const weeks = [ {id:'2026-10-12',label:'12 – 18/10'}, {id:'2026-10-05',label:'05 – 11/10'}, {id:'all',label:'Tất cả thời gian'} ];
