// Demo data (fictional), generated relative to today so "trễ hạn", "hôm nay" and the money charts always have data.
function makeSeed(today) {
  const { addDays, ATT } = WC;
  const d = n => addDays(today, n);
  let s = 7; const rand = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  let n = 0; const id = p => `${p}${++n}`;

  const groups = [['Tổ cắt – chà nhám', '#0891b2'], ['Tổ lắp ráp', '#7c3aed'], ['Tổ bọc – sơn', '#d97706'], ['Tổ kho – đóng gói', '#475569']]
    .map(([name, color]) => ({ id: id('g'), name, color }));
  const G = groups.map(g => g.id);
  const employees = [
    ['Nguyễn Văn Hùng', 'Thợ cắt', 0], ['Trần Thị Mai', 'Bọc nệm', 2], ['Lê Văn Tâm', 'Lắp ráp (tổ trưởng)', 1], ['Phạm Quốc Bảo', 'Chà nhám', 0],
    ['Võ Thị Lan', 'Sơn hoàn thiện', 2], ['Đặng Minh Khoa', 'Đóng gói', 3], ['Bùi Văn Phúc', 'Lắp ráp', 1], ['Huỳnh Thị Thu', 'Thủ kho', 3],
  ].map(([name, role, g], i) => ({ id: id('e'), code: 'NV' + String(i + 1).padStart(2, '0'), name, role, groupId: G[g], phone: `0900 000 2${String(i + 1).padStart(2, '0')}`, active: true }));
  const E = Object.fromEntries(employees.map(e => [e.name, e.id]));

  const customers = [
    ['Cty TNHH Nội thất An Phát', 'Q.7, TP.HCM', 'Khách sỉ, thanh toán 2 đợt', 'muahang@anphat.example'],
    ['Chị Ngọc Hân', 'TP. Thủ Đức', 'Khách lẻ', ''],
    ['Quán cà phê Mộc Nhiên', 'Q. Bình Thạnh, TP.HCM', '', ''],
    ['Showroom Gia Hưng', 'Biên Hoà, Đồng Nai', 'Lấy hàng tại xưởng', 'giahung@example.com'],
    ['Anh Trung Kiên', 'Q.12, TP.HCM', '', ''],
    ['Khách sạn Bình Minh', 'Vũng Tàu', 'Cần xuất hoá đơn VAT', 'ketoan@binhminh.example'],
  ].map(([name, address, note, email], i) => ({ id: id('c'), code: 'KH' + String(i + 1).padStart(3, '0'), name, phone: `0900 000 1${String(i + 1).padStart(2, '0')}`, email, address, note, createdAt: d(-60 + i * 7) }));
  const C = customers.map(c => c.id);

  // shortcut: custom fields are free text, add number/yes-no types when a factory needs them.
  const categories = [
    ['Gỗ & ván', [['loai_go', 'Loại gỗ'], ['do_day', 'Độ dày (mm)']]],
    ['Vải & mút', [['mau', 'Màu'], ['kich_thuoc', 'Khổ / kích thước']]],
    ['Phụ kiện & hoá chất', [['quy_cach', 'Quy cách']]],
    ['Bàn ghế thành phẩm', [['kich_thuoc', 'Kích thước'], ['mau', 'Màu']]],
  ].map(([name, fields]) => ({ id: id('k'), name, fields: fields.map(([key, label]) => ({ key, label })) }));
  const K = categories.map(k => k.id);

  const items = [
    ['GO-SOI-18', 'Ván gỗ sồi 18mm', 'material', 'tấm', 42, 20, 980000, K[0], { loai_go: 'Sồi Mỹ', do_day: '18' }],
    ['MDF-17', 'Ván MDF chống ẩm 17mm', 'material', 'tấm', 12, 15, 420000, K[0], { loai_go: 'MDF lõi xanh', do_day: '17' }],
    ['VAI-NI-XAM', 'Vải nỉ xám', 'material', 'm', 85, 40, 65000, K[1], { mau: 'Xám chuột', kich_thuoc: 'Khổ 1m4' }],
    ['MUT-D40', 'Mút D40 dày 5cm', 'material', 'tấm', 6, 10, 310000, K[1], { kich_thuoc: '1m × 2m' }],
    ['OC-VIT-430', 'Ốc vít 4×30', 'material', 'hộp', 30, 10, 45000, K[2], { quy_cach: 'Hộp 200 con' }],
    ['KEO-SUA', 'Keo sữa', 'material', 'kg', 0, 5, 38000, K[2], { quy_cach: 'Can 5kg' }],
    ['SON-PU', 'Sơn PU bóng', 'material', 'lít', 18, 10, 145000, K[2], { quy_cach: 'Thùng 5 lít' }],
    ['BAN-LE-GC', 'Bản lề giảm chấn', 'material', 'cái', 140, 100, 22000, K[2], { quy_cach: 'Thép không gỉ' }],
    ['TP-BAN-AN-16', 'Bàn ăn gỗ sồi 1m6', 'finished', 'cái', 3, 0, 0, K[3], { kich_thuoc: '1600×900', mau: 'Óc chó' }],
    ['TP-GHE-AN', 'Ghế ăn bọc nỉ', 'finished', 'cái', 14, 0, 0, K[3], { mau: 'Nỉ xám' }],
    ['TP-SOFA-3', 'Sofa 3 chỗ vải nỉ', 'finished', 'bộ', 1, 0, 0, K[3], { kich_thuoc: '2100×850' }],
    ['TP-TU-AO-12', 'Tủ áo 2 cánh 1m2', 'finished', 'cái', 2, 0, 0, K[3], { kich_thuoc: '1200×600×2000' }],
  ].map(([sku, name, type, unit, stock, threshold, lastPrice, categoryId, attrs]) => ({ id: id('i'), sku, name, type, unit, stock, threshold, lastPrice, categoryId, attrs }));
  const I = Object.fromEntries(items.map(i => [i.sku, i]));

  const receipts = [
    [-18, 'NCC Gỗ Bình Dương', [['GO-SOI-18', 30, 980000], ['MDF-17', 20, 420000]]],
    [-14, 'Vải sợi Tân Bình', [['VAI-NI-XAM', 120, 65000], ['MUT-D40', 15, 310000]]],
    [-10, 'Hoá chất Sơn Việt', [['SON-PU', 20, 145000], ['KEO-SUA', 10, 38000]]],
    [-9, 'Kim khí Minh Tâm', [['OC-VIT-430', 20, 45000], ['BAN-LE-GC', 200, 22000]]],
    [-2, 'NCC Gỗ Bình Dương', [['GO-SOI-18', 25, 1000000]]],
  ].map(([day, supplier, lines], k) => ({ id: id('r'), code: 'PN-' + String(k + 1).padStart(3, '0'), date: d(day), supplier, note: '', lines: lines.map(([sku, qty, price]) => ({ itemId: I[sku].id, qty, price })) }));

  const outs = [ // materials issued to production orders
    [-5, 'GO-SOI-18', 18, 'DH-001'], [-5, 'VAI-NI-XAM', 60, 'DH-001'], [-5, 'MUT-D40', 9, 'DH-001'],
    [-8, 'SON-PU', 6, 'DH-002'], [-8, 'KEO-SUA', 10, 'DH-002'], [-8, 'OC-VIT-430', 8, 'DH-002'],
    [-2, 'MDF-17', 14, 'DH-003'], [-2, 'BAN-LE-GC', 60, 'DH-003'], [-2, 'GO-SOI-18', 12, 'DH-003'],
  ];

  // Ledger: opening balance + receipts − issues = current stock, so the numbers reconcile.
  const moves = [];
  for (const it of items) {
    const inQty = receipts.flatMap(r => r.lines).filter(l => l.itemId === it.id).reduce((a, l) => a + l.qty, 0);
    const outQty = outs.filter(o => o[1] === it.sku).reduce((a, o) => a + o[2], 0);
    const open = it.stock - inQty + outQty;
    if (open) moves.push({ id: id('m'), date: d(-30), itemId: it.id, type: 'nhap', qty: open, price: it.lastPrice, ref: '', note: 'Tồn đầu kỳ' });
  }
  for (const r of receipts) for (const l of r.lines) moves.push({ id: id('m'), date: r.date, itemId: l.itemId, type: 'nhap', qty: l.qty, price: l.price, ref: r.code, note: r.supplier });
  for (const [day, sku, qty, ref] of outs) moves.push({ id: id('m'), date: d(day), itemId: I[sku].id, type: 'xuat', qty, price: I[sku].lastPrice, ref, note: 'Xuất vật tư cho đơn' });

  const L = (name, qty, price, note = '') => ({ name, qty, price, note });
  const P = (day, amount, kind, method = 'ck', note = '') => ({ id: id('p'), date: d(day), amount, kind, method, note });
  const X = (name, amount) => ({ name, amount });
  const M = (sku, qty) => ({ itemId: I[sku].id, qty });
  const orders = [
    { code: 'DH-001', c: 0, priority: 'G1', status: 'dang', start: -5, end: 1, due: 2, lines: [L('Bàn ăn gỗ sồi 1m6', 6, 7500000, 'Màu óc chó'), L('Ghế ăn bọc nỉ', 24, 1350000, 'Nỉ xám')], deposit: 30000000, payments: [P(-6, 30000000, 'coc')], costs: [X('Nhân công', 12000000), X('Vận chuyển', 1500000)], materials: [M('GO-SOI-18', 18), M('VAI-NI-XAM', 60), M('MUT-D40', 9)], issued: true, note: 'Giao 2 đợt, đợt 1 trước 8h sáng' },
    { code: 'DH-002', c: 2, priority: 'G2', status: 'dang', start: -8, end: -2, due: -1, lines: [L('Bàn cà phê tròn 60cm', 12, 1200000), L('Ghế gỗ tựa lưng', 30, 850000)], deposit: 10000000, payments: [P(-9, 10000000, 'coc', 'tm')], costs: [X('Nhân công', 6000000)], materials: [M('SON-PU', 6), M('KEO-SUA', 10), M('OC-VIT-430', 8)], issued: true, note: 'Khách hối, đã gọi 2 lần' },
    { code: 'DH-003', c: 5, priority: 'G2', status: 'dang', start: -2, end: 8, due: 10, lines: [L('Giường đôi 1m6', 10, 6200000, 'Có ngăn kéo'), L('Tủ đầu giường', 20, 1100000)], deposit: 40000000, payments: [P(-3, 25000000, 'coc'), P(-1, 15000000, 'coc', 'ck', 'Cọc đợt 2')], costs: [X('Nhân công', 15000000)], materials: [M('MDF-17', 14), M('BAN-LE-GC', 60), M('GO-SOI-18', 12)], issued: true, note: '' },
    { code: 'DH-004', c: 1, priority: 'G3', status: 'cho', start: 1, end: 7, due: 9, lines: [L('Sofa 3 chỗ vải nỉ', 1, 14500000, 'Nỉ xám, chân gỗ')], deposit: 5000000, payments: [P(-1, 5000000, 'coc', 'tm')], costs: [], materials: [M('VAI-NI-XAM', 12), M('MUT-D40', 4)], note: '' },
    { code: 'DH-005', c: 3, priority: 'G1', status: 'cho', start: 2, end: 12, due: 14, lines: [L('Tủ áo 2 cánh 1m2', 8, 5800000)], deposit: 15000000, payments: [], costs: [], materials: [M('MDF-17', 20), M('BAN-LE-GC', 32)], note: 'Chờ khách chốt màu sơn' },
    { code: 'DH-006', c: 4, priority: 'G4', status: 'cho', start: 5, end: 20, due: 25, lines: [L('Kệ sách 5 tầng', 2, 2300000)], deposit: 0, payments: [], costs: [], materials: [M('GO-SOI-18', 4)], note: '' },
    { code: 'DH-007', c: 0, priority: 'G3', status: 'xong', start: -30, end: -13, due: -12, lines: [L('Bàn làm việc 1m4', 15, 3200000)], deposit: 15000000, payments: [P(-31, 15000000, 'coc'), P(-12, 33000000, 'tt')], costs: [X('Vật tư (trước khi dùng kho)', 18000000), X('Nhân công', 9000000)], final: true, note: '' },
    { code: 'DH-008', c: 3, priority: 'G2', status: 'xong', start: -22, end: -7, due: -6, lines: [L('Ghế ăn bọc nỉ', 40, 1300000)], deposit: 20000000, payments: [P(-23, 20000000, 'coc'), P(-6, 20000000, 'tt', 'tm')], costs: [X('Vật tư (trước khi dùng kho)', 21000000), X('Nhân công', 8000000), X('Vận chuyển Biên Hoà', 1800000)], final: true, note: 'Còn nợ 12 triệu, hẹn cuối tháng' },
    { code: 'DH-009', c: 2, priority: 'G3', status: 'xong', start: -40, end: -26, due: -25, lines: [L('Quầy bar gỗ 2m4', 1, 18500000), L('Ghế bar', 8, 950000)], deposit: 10000000, payments: [P(-41, 10000000, 'coc'), P(-25, 16100000, 'tt')], costs: [X('Vật tư (trước khi dùng kho)', 9500000), X('Nhân công', 5000000), X('Gia công ngoài – uốn sắt', 1200000)], final: true, note: '' },
    { code: 'DH-010', c: 4, priority: 'G4', status: 'huy', start: -10, end: -3, due: -2, lines: [L('Bàn trà mặt đá', 1, 3500000)], deposit: 1000000, payments: [P(-11, 1000000, 'coc', 'tm'), P(-8, 1000000, 'hoan', 'tm', 'Trả lại cọc')], costs: [], note: 'Khách huỷ, đã hoàn cọc' },
  ].map(o => ({
    id: id('o'), code: o.code, customerId: C[o.c], priority: o.priority, status: o.status, start: d(o.start), end: d(o.end), due: d(o.due),
    lines: o.lines, deposit: o.deposit, payments: o.payments, costs: o.costs, costFinal: !!o.final, materials: o.materials || [], materialsIssued: !!o.issued,
    note: o.note, createdAt: d(o.start - 2), doneAt: o.status === 'xong' ? d(o.due - 1) : '', process: null,
  }));
  const O = Object.fromEntries(orders.map(o => [o.code, o]));

  // Reusable process blocks (công đoạn mẫu) and an optional process on some orders.
  const blocks = [
    ['Cắt phôi', 1, '#2563eb', 'Cắt ván theo bản vẽ'], ['Chà nhám', 1, '#0891b2', ''], ['Lắp ráp', 2, '#7c3aed', ''],
    ['Bọc nệm', 1, '#db2777', 'Chỉ cho ghế, sofa'], ['Sơn hoàn thiện', 2, '#d97706', 'Chờ khô 24h giữa 2 lớp'], ['Kiểm tra QC', 1, '#059669', ''], ['Đóng gói', 1, '#475569', ''],
  ].map(([name, days, color, note]) => ({ id: id('b'), name, days, color, note }));
  const B = Object.fromEntries(blocks.map(b => [b.name, b]));
  const proc = (names, doneCount, startOffset, active = true) => ({
    steps: names.map((nm, k) => ({ id: id('s'), blockId: B[nm].id, name: nm, color: B[nm].color, days: B[nm].days,
      status: k < doneCount ? 'xong' : k === doneCount && active ? 'dang' : 'cho', doneAt: k < doneCount ? d(startOffset + k + 1) : '' })),
  });
  O['DH-001'].process = proc(['Cắt phôi', 'Chà nhám', 'Lắp ráp', 'Bọc nệm', 'Sơn hoàn thiện', 'Đóng gói'], 2, -5);
  O['DH-002'].process = proc(['Cắt phôi', 'Lắp ráp', 'Sơn hoàn thiện', 'Đóng gói'], 2, -8);
  O['DH-003'].process = proc(['Cắt phôi', 'Chà nhám', 'Lắp ráp', 'Sơn hoàn thiện', 'Kiểm tra QC', 'Đóng gói'], 0, -2);
  O['DH-005'].process = proc(['Cắt phôi', 'Lắp ráp', 'Sơn hoàn thiện', 'Đóng gói'], 0, 0, false);
  O['DH-007'].process = proc(['Cắt phôi', 'Lắp ráp', 'Sơn hoàn thiện', 'Đóng gói'], 4, -30);

  const expenses = [];
  const EXP = (day, category, amount, note, orderRef = '') => expenses.push({ id: id('x'), date: d(day), category, amount, note, orderRef });
  for (const m of [3, 2, 1]) { // recurring costs for the last months
    const first = WC.localISO(new Date(new Date(today + 'T00:00:00').getFullYear(), new Date(today + 'T00:00:00').getMonth() - m + 1, 5));
    const off = WC.daysBetween(today, first);
    if (off > 0) continue;
    EXP(off, 'Lương', 62000000 + m * 1000000, `Lương tháng ${new Date(first + 'T00:00:00').getMonth() || 12}`);
    EXP(off, 'Mặt bằng', 15000000, 'Thuê xưởng');
    EXP(off + 3, 'Điện nước', 3800000 + m * 200000, 'Hoá đơn điện nước');
  }
  EXP(-6, 'Vận chuyển', 1800000, 'Xe tải giao Biên Hoà', 'DH-008');
  EXP(-3, 'Sửa chữa máy', 2500000, 'Thay lưỡi cưa bàn');
  EXP(-1, 'Khác', 650000, 'Nước uống, vật dụng xưởng');

  const bills = [
    { order: 'DH-007', date: -12, status: 'phathanh' }, { order: 'DH-008', date: -6, status: 'phathanh' }, { order: 'DH-001', date: -1, status: 'nhap' },
  ].map((b, k) => {
    const o = O[b.order], c = customers.find(x => x.id === o.customerId);
    return { id: id('h'), code: 'HD-' + String(k + 1).padStart(3, '0'), orderId: o.id, date: d(b.date), dueDate: d(b.date + 15), status: b.status,
      snap: { customer: { name: c.name, address: c.address, phone: c.phone }, lines: o.lines.map(l => ({ ...l })), orderCode: o.code } };
  });

  const notes = [
    { type: 'note', day: -1, time: '16:40', by: 'Nguyễn Văn Hùng', text: 'Máy cưa bàn số 2 kêu to, cần kiểm tra trước khi cắt đơn mới.', ref: '', status: 'open' },
    { type: 'note', day: 0, time: '07:15', by: 'Chủ xưởng', text: 'Khách An Phát muốn đổi màu ghế sang nâu đậm – chờ khách gửi mẫu.', ref: 'DH-001', status: 'open' },
    { type: 'note', day: -2, time: '10:05', by: 'Huỳnh Thị Thu', text: 'Đã nhận đủ ván gỗ sồi đợt 2.', ref: '', status: 'resolved' },
    { type: 'proposal', day: 0, time: '07:40', by: 'Lê Văn Tâm', text: 'Đề xuất làm DH-003 trước DH-002 phần lắp ráp vì khách sạn cần gấp phòng mẫu.', ref: 'DH-003', status: 'open' },
    { type: 'proposal', day: -3, time: '07:20', by: 'Võ Thị Lan', text: 'Đổi sơn PU bóng sang mờ cho DH-002 theo ý khách.', ref: 'DH-002', status: 'approved' },
  ].map(x => ({ id: id('n'), type: x.type, date: d(x.day), time: x.time, by: x.by, text: x.text, ref: x.ref, status: x.status, resolvedAt: x.status === 'open' ? '' : d(x.day) }));

  const reports = [
    { day: -1, by: 'Huỳnh Thị Thu', lines: [['DH-001', 'Chà nhám', 30, 0], ['DH-002', 'Lắp ráp', 40, 2]], note: '2 ghế DH-002 nứt chân, đã để riêng chờ sửa.' },
    { day: -2, by: 'Huỳnh Thị Thu', lines: [['DH-001', 'Cắt phôi', 30, 0], ['DH-003', 'Cắt phôi', 12, 1]], note: 'Thiếu keo sữa, đã báo mua.' },
  ].map(r => ({ id: id('t'), date: d(r.day), by: r.by, lines: r.lines.map(([code, step, done, defects]) => ({ orderId: O[code].id, step, done, defects })), note: r.note, photos: [], history: [], createdAt: `${d(r.day)} 17:05` }));

  // Assigned work: owner → person or whole group; worker accepts, then marks done or reports a problem with photos.
  const at = (day, hm) => `${d(day)} ${hm}`;
  const T = (code, day, order, text, g, who, status, times, extra = {}) => ({
    id: id('w'), code, date: d(day), orderId: order ? O[order].id : '', text, groupId: G[g], empId: who ? E[who] : '', status, by: 'Chủ xưởng',
    createdAt: at(day, times[0]), acceptedAt: times[1] ? at(day, times[1]) : '', acceptedBy: times[1] && who ? E[who] : '', doneAt: times[2] ? at(day, times[2]) : '',
    issue: null, review: null, ...extra,
  });
  const tasks = [
    T('CV-001', -1, 'DH-007', 'Đóng gói 15 bàn làm việc, dán nhãn khách', 3, 'Đặng Minh Khoa', 'xong', ['07:30', '07:40', '15:10'], { review: { ok: true, note: '', at: at(-1, '16:00') } }),
    T('CV-002', 0, 'DH-001', 'Lắp khung 6 bàn ăn gỗ sồi', 1, 'Lê Văn Tâm', 'nhan', ['07:15', '07:35', '']),
    T('CV-003', 0, 'DH-002', 'Sơn lót 12 bàn cà phê, để khô trước 15h', 2, '', 'moi', ['07:20', '', '']),
    T('CV-004', 0, 'DH-003', 'Cắt ván MDF cho 10 giường theo bản vẽ', 0, 'Nguyễn Văn Hùng', 'xong', ['07:10', '07:25', '11:20']),
    T('CV-005', 0, 'DH-001', 'Bọc nệm 8 ghế ăn đầu tiên', 2, 'Trần Thị Mai', 'loi', ['07:15', '07:30', '10:05'], { issue: { text: 'Vải nỉ xám lô mới bị lệch màu ở 2 cây, không đủ vải đúng màu để bọc 8 ghế. Em đã để riêng chờ anh xem.', photos: [], at: at(0, '10:05') } }),
  ];

  const messages = [];
  const MSG = (ch, from, day, hm, text, taskId = '') => messages.push({ id: id('c'), ch, from, at: at(day, hm), text, photo: '', taskId });
  MSG('all', 'owner', -1, '16:30', 'Thứ 7 này cả xưởng làm nửa ngày, chiều nghỉ bảo trì máy.');
  MSG('all', E['Huỳnh Thị Thu'], -1, '16:42', 'Dạ, em báo các tổ rồi ạ.');
  MSG(G[1], 'owner', 0, '07:10', 'Hôm nay ưu tiên DH-001, chiều khách An Phát qua xem mẫu bàn.');
  MSG(G[1], 'owner', 0, '07:15', '', tasks[1].id);
  MSG(G[1], E['Lê Văn Tâm'], 0, '07:36', 'Dạ rõ, em nhận rồi.');
  MSG(G[2], 'owner', 0, '07:15', '', tasks[4].id);
  MSG(G[2], 'owner', 0, '07:20', '', tasks[2].id);
  MSG(G[2], E['Trần Thị Mai'], 0, '10:06', 'Vải lỗi màu em đã báo lỗi trong việc CV-005 rồi ạ.');
  MSG(G[0], 'owner', 0, '07:10', '', tasks[3].id);
  MSG(G[3], 'owner', -1, '07:30', '', tasks[0].id);

  const notifs = [
    ['owner', at(0, '10:05'), 'Trần Thị Mai báo lỗi: Bọc nệm 8 ghế ăn đầu tiên', '#/giao-viec', false],
    ['owner', at(0, '11:20'), 'Nguyễn Văn Hùng đã xong: Cắt ván MDF cho 10 giường', '#/giao-viec', false],
    ['owner', at(0, '07:36'), 'Lê Văn Tâm đã nhận việc: Lắp khung 6 bàn ăn gỗ sồi', '#/giao-viec', true],
    [E['Võ Thị Lan'], at(0, '07:20'), 'Việc mới cho Tổ bọc – sơn: Sơn lót 12 bàn cà phê', '#/giao-viec', false],
    [E['Trần Thị Mai'], at(0, '07:20'), 'Việc mới cho Tổ bọc – sơn: Sơn lót 12 bàn cà phê', '#/giao-viec', false],
    [E['Lê Văn Tâm'], at(0, '07:10'), 'Chủ xưởng nhắn Tổ lắp ráp: Hôm nay ưu tiên DH-001…', '#/giao-viec?tab=chat', true],
  ].map(([to, t, text, link, read]) => ({ id: id('f'), to, at: t, text, link, read }));

  const att = {};
  for (let k = -26; k <= -1; k++) {
    const day = d(k); if (new Date(day + 'T00:00:00').getDay() === 0) continue; // Sunday off
    att[day] = {};
    for (const e of employees) {
      const r = rand();
      const st = r < 0.86 ? 'co' : r < 0.92 ? 'muon' : r < 0.95 ? 'nua' : r < 0.98 ? 'phep' : 'vang';
      const m = String(Math.floor(rand() * 10)).padStart(2, '0');
      att[day][e.id] = { s: st, in: ATT[st].w ? (st === 'muon' ? `07:${45 + Math.floor(rand() * 14)}` : `07:${m.replace(/^./, '2')}`) : '', out: st === 'nua' ? '11:30' : ATT[st].w ? `17:${m}` : '' };
    }
  }

  return {
    v: 4, meta: { name: 'Xưởng mộc mẫu', shiftStart: '07:30', capacity: 3, role: 'owner', meId: E['Lê Văn Tâm'], ignoreLock: false },
    groups, employees, customers, categories, items, receipts, moves, orders, blocks, expenses, bills, notes, reports, tasks, messages, notifs, seen: {}, att,
  };
}
