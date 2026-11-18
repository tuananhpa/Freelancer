/* Warecon mockup – core, components and views. Forms and actions live in forms.js. Data: localStorage (demo only). */
const { ATT, PRI, OPEN, fold, addDays, daysBetween, orderValue, isLate, queueSort } = WC;
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const num = n => new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 3 }).format(n || 0);
const money = n => new Intl.NumberFormat('vi-VN').format(Math.round(n || 0)) + ' ₫';
const mshort = n => (Math.abs(n) >= 1e6 ? num(Math.round(n / 1e5) / 10) + ' tr' : money(n));
const pct = x => `${Math.round(x * 100)}%`;
const parseMoney = v => +String(v || '').replace(/\D/g, '') || 0;
const fdate = iso => (iso ? iso.split('-').reverse().join('/') : '—');
const today = () => WC.localISO();
const WEEKDAY = ['Chủ nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
const weekday = iso => WEEKDAY[new Date(iso + 'T00:00:00').getDay()];
const icon = n => `<svg class="i" aria-hidden="true"><use href="#i-${n}"/></svg>`;
const uid = () => (crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2));

const STATUS = { cho: 'Trong hàng chờ', dang: 'Đang làm', xong: 'Hoàn thành', huy: 'Đã huỷ' };
const STATUS_TAB = { cho: 'Chờ', dang: 'Đang làm', xong: 'Xong', huy: 'Huỷ' };
const STATUS_C = { cho: 'slate', dang: 'blue', xong: 'green', huy: 'ghost' };
const PRI_L = { G1: 'Gấp', G2: 'Cao', G3: 'Thường', G4: 'Thấp' };
const MOVE_L = { nhap: 'Nhập', xuat: 'Xuất', dieuchinh: 'Điều chỉnh' };
const PAY_L = { coc: 'Đặt cọc', tt: 'Thanh toán', hoan: 'Hoàn tiền' };
const METHOD_L = { tm: 'Tiền mặt', ck: 'Chuyển khoản' };
const BILL_L = { nhap: 'Nháp', phathanh: 'Đã phát hành', huy: 'Đã huỷ' };
const ROLE_L = { owner: 'Chủ xưởng', nhaplieu: 'Người nhập liệu', staff: 'Nhân viên' };
const EXP_CATS = ['Lương', 'Mặt bằng', 'Điện nước', 'Vận chuyển', 'Sửa chữa máy', 'Gia công ngoài', 'Khác'];

/* ---------- store ---------- */
const KEY = 'warecon.mock.v4';
let db;
try { db = JSON.parse(localStorage.getItem(KEY)); } catch { db = null; }
if (!db || db.v !== 4) db = makeSeed(today());
function save() {
  if (typeof LIVE !== 'undefined' && LIVE.on) return liveSave();
  try { localStorage.setItem(KEY, JSON.stringify(db)); }
  catch { toast('Không lưu được vào trình duyệt (bộ nhớ đầy – thử bớt ảnh báo cáo).'); }
}
const cust = id => db.customers.find(c => c.id === id) || { name: '(Khách đã xoá)' };
const item = id => db.items.find(i => i.id === id) || { name: '(Mặt hàng đã xoá)', unit: '' };
const order = id => db.orders.find(o => o.id === id);
const orderByCode = code => db.orders.find(o => o.code === code);
const emp = id => db.employees.find(e => e.id === id) || { name: '—' };
const activeEmps = () => db.employees.filter(e => e.active);
const billOf = o => db.bills.find(b => b.orderId === o.id && b.status !== 'huy');

/* ---------- roles (demo switch; the real API must also hide the data) ---------- */
const role = () => db.meta.role;
const can = k => ({ money: role() !== 'staff', fin: role() === 'owner', manage: role() !== 'staff', owner: role() === 'owner' })[k];
// Who is looking: managers share the 'owner' inbox; a worker is identified by their employee id.
const me = () => (role() === 'staff' ? db.meta.meId : 'owner');
const meEmp = () => (role() === 'staff' ? emp(db.meta.meId) : null);
const meName = () => (role() === 'staff' ? emp(db.meta.meId).name : ROLE_L[role()]);
const group = id => db.groups.find(g => g.id === id) || { name: 'Chưa xếp tổ', color: '#94a3b8' };
const members = gid => activeEmps().filter(e => e.groupId === gid);
const byGroup = list => list.slice().sort((a, b) => db.groups.findIndex(g => g.id === a.groupId) - db.groups.findIndex(g => g.id === b.groupId));
const who = id => (id === 'owner' ? 'Chủ xưởng' : emp(id).name);
const nowStr = () => `${today()} ${new Date().toTimeString().slice(0, 5)}`;
const TASK_ST = { moi: ['Chờ nhận', 'amber'], nhan: ['Đang làm', 'blue'], xong: ['Đã xong', 'green'], loi: ['Báo lỗi', 'red'] };
const myTasks = () => db.tasks.filter(t => WC.taskVisibleTo(t, db.meta.meId, meEmp()?.groupId));
const unreadNotifs = () => db.notifs.filter(n => n.to === me() && !n.read);
const channels = () => [{ id: 'all', name: 'Toàn xưởng', color: '#13294b' }, ...db.groups].filter(c => role() !== 'staff' || c.id === 'all' || c.id === meEmp()?.groupId);
const unreadIn = ch => db.messages.filter(m => m.ch === ch && m.from !== me() && m.at > (db.seen[me()]?.[ch] || '')).length;
// Badge on "Giao việc": workers – new tasks + unread chat; managers – work waiting for review + unread chat.
const workBadge = () => (role() === 'staff' ? myTasks().filter(t => t.status === 'moi').length : db.tasks.filter(WC.needsReview).length) + channels().reduce((s, c) => s + unreadIn(c.id), 0);

/* ---------- ui state ---------- */
const ui = {
  orderTab: 'dang', ordersSub: 'don', q: '', khoTab: 'ton', khoFilter: 'all', attTab: 'ngay', attDate: today(), month: today().slice(0, 7),
  tcTab: 'tong', period: 'thang', pdate: today(), ledgerDir: 'all', noteTab: 'note', open: new Set(),
  workTab: 'viec', taskFilter: '', channel: '',
};
let currentList = null;

/* ---------- small components ---------- */
const chip = (text, c = 'slate') => `<span class="chip ${c}">${esc(text)}</span>`;
const priChip = p => chip(`${p} · ${PRI_L[p]}`, { G1: 'red', G2: 'amber', G3: 'slate', G4: 'ghost' }[p]);
const empty = t => `<div class="empty">${esc(t)}</div>`;
const section = (title, body, extra = '') => `<section class="sec"><div class="sec-h"><h2>${title}</h2>${extra}</div>${body}</section>`;
const searchBox = ph => `<label class="search">${icon('search')}<span class="sr">Tìm kiếm</span><input type="search" placeholder="${ph}" value="${esc(ui.q)}" data-search></label>`;
const tabs = (key, map, counts) => `<div class="tabs" role="tablist">${Object.entries(map).map(([k, l]) => `<button role="tab" aria-selected="${ui[key] === k}" data-act="tab" data-key="${key}" data-val="${k}">${l}${counts ? ` <span>${counts[k]}</span>` : ''}</button>`).join('')}</div>`;
const tel = p => `<a href="tel:${esc(String(p).replace(/\s/g, ''))}">${esc(p)}</a>`;

function dueText(o) {
  if (o.status === 'xong') return `Xong ${fdate(o.doneAt)}`;
  if (o.status === 'huy') return 'Đã huỷ';
  const n = daysBetween(today(), o.due);
  return n < 0 ? `<b class="t-red">Trễ ${-n} ngày</b>` : n === 0 ? '<b class="t-amber">Giao hôm nay</b>' : `còn ${n} ngày`;
}

function procSummary(o) {
  if (!o.process) return '';
  const st = o.process.steps, c = WC.currentStep(o.process), done = st.filter(s => s.status === 'xong').length;
  return `<div class="prog" role="img" aria-label="Tiến độ ${done}/${st.length} công đoạn">${st.map(s => `<i class="${s.status}" style="--c:${s.color}"></i>`).join('')}</div>
    <div class="o-meta">${c < 0 ? '<b class="t-green">Đã xong mọi công đoạn</b>' : `Công đoạn: <b style="color:${st[c].color}">${esc(st[c].name)}</b>${st[c].status === 'cho' ? ' (chưa bắt đầu)' : ''}`} · ${done}/${st.length}</div>`;
}

function procDetail(o) {
  if (!o.process) return '';
  const st = o.process.steps, c = WC.currentStep(o.process), plan = WC.planSteps(o.start, st);
  const over = daysBetween(o.due, plan[plan.length - 1].to), last = c < 0 ? st.length - 1 : c - 1, live = OPEN.includes(o.status);
  return `<section class="ob-sec"><div class="ob-h"><h3>Quy trình sản xuất</h3>${over > 0 && live ? chip(`Kế hoạch vượt hạn giao ${over} ngày`, 'red') : ''}</div>
    <ol class="steps-view">${st.map((s, i) => `<li class="${s.status}" style="--c:${s.color}">
      <span class="num">${s.status === 'xong' ? '✓' : i + 1}</span>
      <div class="sv-main"><b>${esc(s.name)}</b><small>Dự kiến ${fdate(plan[i].from)}${plan[i].to !== plan[i].from ? ' – ' + fdate(plan[i].to) : ''} · ${s.days} ngày${s.doneAt ? ` · xong ${fdate(s.doneAt)}` : ''}</small></div>
      <div class="sv-act">${!live ? '' : i === c ? (s.status === 'dang'
        ? `<button class="btn sm primary" data-act="step-done" data-id="${o.id}">${icon('check')}Xong công đoạn</button>`
        : `<button class="btn sm primary" data-act="step-start" data-id="${o.id}">Bắt đầu</button>`)
        : i === last ? `<button class="btn sm ghost" data-act="step-undo" data-id="${o.id}">Hoàn tác</button>` : ''}</div></li>`).join('')}</ol></section>`;
}

function materialsBlock(o) {
  if (!o.materials?.length) return '';
  return `<section class="ob-sec"><div class="ob-h"><h3>Vật tư cho đơn</h3>${o.materialsIssued ? chip('Đã xuất kho', 'green') : ''}</div>
    <div class="mat-list">${o.materials.map(m => {
      const it = item(m.itemId), ok = o.materialsIssued || it.stock >= m.qty;
      return `<div class="mat"><span>${esc(it.name)}</span><span class="muted">cần ${num(m.qty)} ${esc(it.unit)}${o.materialsIssued ? '' : ` · tồn ${num(it.stock)}`}</span>${o.materialsIssued ? '' : ok ? chip('Đủ', 'green') : chip(`Thiếu ${num(m.qty - it.stock)}`, 'red')}</div>`;
    }).join('')}</div>
    ${!o.materialsIssued && OPEN.includes(o.status) ? '<p class="hint">Đủ vật tư thì mới chuyển được sang “Đang làm”. Khi bắt đầu, app tự xuất kho số vật tư này.</p>' : ''}</section>`;
}

function moneyBlock(o, F) {
  if (!can('money')) return '';
  const pays = o.payments || [], b = billOf(o);
  return `<section class="ob-sec"><div class="ob-h"><h3>Tiền của đơn</h3>${can('manage') && o.status !== 'huy' ? `<button class="btn sm" data-act="pay-new" data-id="${o.id}">${icon('plus')}Ghi nhận thu tiền</button>` : ''}</div>
    <div class="stat4">
      <div><span>Giá trị đơn</span><b>${money(F.value)}</b></div>
      <div><span>Tiền cọc yêu cầu</span><b>${money(F.deposit)}</b><small class="${F.deposit && !F.depositOk ? 't-red' : 't-green'}">${!F.deposit ? 'Không yêu cầu cọc' : F.depositOk ? 'Đã cọc đủ' : `Còn thiếu ${money(F.deposit - Math.max(0, F.received))}`}</small></div>
      <div><span>Đã thu</span><b class="t-green">${money(F.received)}</b><small>${pays.length} lần thu</small></div>
      <div><span>Còn phải thu</span><b class="${F.balance > 0 ? 't-red' : ''}">${money(F.balance)}</b></div>
    </div>
    ${pays.length ? `<div class="tbl"><table><thead><tr><th>Ngày</th><th>Loại</th><th>Hình thức</th><th>Ghi chú</th><th class="r">Số tiền</th></tr></thead><tbody>
      ${pays.slice().sort((a, b) => a.date.localeCompare(b.date)).map(p => `<tr><td>${fdate(p.date)}</td><td>${chip(PAY_L[p.kind], { coc: 'blue', tt: 'green', hoan: 'red' }[p.kind])}</td><td>${METHOD_L[p.method] || ''}</td><td class="muted wrap">${esc(p.note)}</td><td class="r ${p.kind === 'hoan' ? 't-red' : ''}">${p.kind === 'hoan' ? '−' : ''}${money(p.amount)}</td></tr>`).join('')}
      </tbody></table></div>` : '<p class="hint">Chưa thu đồng nào.</p>'}
    ${can('fin') ? `<div class="cost">
      <div class="cost-h"><b>Giá thành</b>${chip(o.costFinal ? 'Đã chốt' : 'Tạm tính', o.costFinal ? 'green' : 'amber')}</div>
      <div class="cost-row"><span>Vật tư đã xuất kho</span><b>${money(F.mat)}</b></div>
      ${(o.costs || []).map(c => `<div class="cost-row"><span>${esc(c.name)}</span><b>${money(c.amount)}</b></div>`).join('')}
      <div class="cost-row tot"><span>Giá vốn</span><b>${money(F.cost)}</b></div>
      <div class="cost-row tot"><span>Lãi ${o.costFinal ? '' : 'tạm tính'}</span><b class="${F.profit < 0 ? 't-red' : 't-green'}">${money(F.profit)} <small>(${pct(F.margin)})</small></b></div>
      <div class="row-act"><button class="btn sm" data-act="cost-edit" data-id="${o.id}">Sửa giá thành</button>
      ${b ? `<button class="btn sm" data-act="bill-view" data-id="${b.id}">${icon('print')}Hoá đơn ${esc(b.code)}</button>` : o.status !== 'huy' ? `<button class="btn sm" data-act="bill-new" data-id="${o.id}">${icon('plus')}Tạo hoá đơn</button>` : ''}</div>
    </div>` : ''}</section>`;
}

function orderCard(o) {
  const c = cust(o.customerId), F = WC.finance(o, db.moves), late = isLate(o, today());
  const short = o.status === 'cho' ? WC.shortages(o, db.items) : [];
  const next = { cho: ['dang', 'Bắt đầu làm'], dang: ['xong', 'Hoàn thành'], xong: ['dang', 'Mở lại'], huy: ['cho', 'Khôi phục đơn'] }[o.status];
  return `<details class="card order${late ? ' late' : ''}${o.status === 'huy' ? ' void' : ''}" data-id="${o.id}" ${ui.open.has(o.id) ? 'open' : ''}>
    <summary>
      <div class="o-top"><b class="o-code">${esc(o.code)}</b>${priChip(o.priority)}${late ? chip('Trễ hạn', 'red') : chip(STATUS[o.status], STATUS_C[o.status])}${short.length ? chip('Thiếu vật tư', 'amber') : ''}${can('money') ? `<span class="o-val">${money(F.value)}</span>` : ''}</div>
      <div class="o-cust">${esc(c.name)}</div>
      <div class="o-meta">${fdate(o.start)} → ${fdate(o.end)} · khách nhận ${fdate(o.due)} · ${dueText(o)}</div>
      ${can('money') && o.status !== 'huy' ? `<div class="o-money"><span>${F.deposit ? `Cọc ${mshort(F.deposit)} ${F.depositOk ? '<b class="t-green">✓</b>' : '<b class="t-red">chưa đủ</b>'}` : 'Không cọc'}</span><span>Đã thu <b>${mshort(F.received)}</b></span><span>Còn <b class="${F.balance > 0 ? 't-red' : 't-green'}">${mshort(F.balance)}</b></span></div>` : ''}
      ${procSummary(o)}
      ${icon('chev')}
    </summary>
    <div class="o-body">
      <dl class="kv">
        <div><dt>Khách hàng</dt><dd><a href="#/khach-hang/${c.id}">${esc(c.name)}</a>${c.phone ? ` · ${tel(c.phone)}` : ''}</dd></div>
        <div><dt>Bắt đầu</dt><dd>${fdate(o.start)}</dd></div>
        <div><dt>Kết thúc dự kiến</dt><dd>${fdate(o.end)}</dd></div>
        <div><dt>Khách muốn nhận</dt><dd>${fdate(o.due)}</dd></div>
      </dl>
      ${procDetail(o)}
      <section class="ob-sec"><h3>Hàng trong đơn</h3><div class="tbl"><table>
        <thead><tr><th>Hàng</th><th>Quy cách / ghi chú</th><th class="r">SL</th>${can('money') ? '<th class="r">Đơn giá</th><th class="r">Thành tiền</th>' : ''}</tr></thead>
        <tbody>${o.lines.map(l => `<tr><td class="wrap">${esc(l.name)}</td><td class="muted wrap">${esc(l.note) || '—'}</td><td class="r">${num(l.qty)}</td>${can('money') ? `<td class="r">${money(l.price)}</td><td class="r">${money(l.qty * l.price)}</td>` : ''}</tr>`).join('')}</tbody>
      </table></div></section>
      ${materialsBlock(o)}
      ${moneyBlock(o, F)}
      ${o.note ? `<p class="note">📝 ${esc(o.note)}</p>` : ''}
      <div class="row-act">
        ${can('manage') ? `<button class="btn primary" data-act="order-status" data-id="${o.id}" data-to="${next[0]}">${next[1]}</button>
        <button class="btn" data-act="order-edit" data-id="${o.id}">Sửa đơn</button>
        <button class="btn" data-act="order-copy" data-id="${o.id}">Tạo đơn tương tự</button>
        ${OPEN.includes(o.status) ? `<button class="btn ghost t-red" data-act="order-cancel" data-id="${o.id}">Huỷ đơn</button>` : ''}` : ''}
        <button class="btn" data-act="task-new" data-order="${o.id}">${icon('plus')}Giao việc</button>
      </div>
    </div>
  </details>`;
}

/* ---------- views ---------- */
const views = {
  home() {
    const t = today(), cap = db.meta.capacity;
    const dang = db.orders.filter(o => o.status === 'dang').sort(queueSort);
    const late = db.orders.filter(o => isLate(o, t)).sort(queueSort);
    const low = db.items.filter(i => WC.reorderQty(i) > 0);
    const day = db.att[t] || {}, emps = activeEmps();
    const marked = emps.filter(e => day[e.id]).length, present = emps.filter(e => day[e.id] && ATT[day[e.id].s].w > 0).length;
    const full = Object.entries(WC.loadByDay(db.orders, t, 30)).filter(([, c]) => c.length > cap).sort();
    const props = db.notes.filter(n => n.type === 'proposal' && n.status === 'open'), openNotes = db.notes.filter(n => n.type === 'note' && n.status === 'open');
    const kpi = (label, val, unit, href, c = '') => `<a class="card kpi ${c}" href="${href}"><span>${label}</span><b>${val}</b><small>${unit}</small></a>`;
    let moneyRow = '';
    if (can('fin')) {
      const [a, b] = WC.periodRange('thang', t), cf = WC.cashflow(WC.moneyLedger(db), a, b);
      const due = db.orders.filter(o => o.status !== 'huy').reduce((s, o) => s + Math.max(0, orderValue(o) - WC.received(o)), 0);
      moneyRow = `<a class="card money-row" href="#/thu-chi"><span>Tháng ${+t.slice(5, 7)}</span><span>Thu <b class="t-green">${mshort(cf.in)}</b></span><span>Chi <b class="t-red">${mshort(cf.out)}</b></span><span>Còn phải thu <b>${mshort(due)}</b></span>${icon('right')}</a>`;
    }
    return `
      <p class="date-line">${weekday(t)}, ${fdate(t)} · ${esc(db.meta.name)} · ${esc(meName())}${meEmp() ? ' · ' + esc(group(meEmp().groupId).name) : ''}</p>
      ${role() === 'staff' ? section('Việc của tôi', `<div class="stack">${myTasks().filter(x => x.status === 'moi' || x.status === 'nhan').map(x => taskCard(x)).join('') || empty('Không có việc đang chờ. Việc mới sẽ hiện ở đây kèm thông báo.')}</div>`, '<a class="link" href="#/giao-viec">Tất cả →</a>') : ''}
      ${full.length && can('manage') ? `<div class="alert red">${icon('alert')}<div><b>Lịch kín: ${full.length} ngày trong 30 ngày tới có hơn ${cap} đơn chạy cùng lúc</b>
        <span>Từ ${fdate(full[0][0]).slice(0, 5)}${full.length > 1 ? ` đến ${fdate(full[full.length - 1][0]).slice(0, 5)}` : ''}: ${esc(full[0][1].join(', '))}</span>
        <span>Xem lại mức ưu tiên, dời ngày bắt đầu hoặc tăng số đơn song song trong Cài đặt.</span></div></div>` : ''}
      <div class="kpis">
        ${kpi('Đang làm', dang.length, 'đơn hàng', '#/don-hang?tab=dang')}
        ${kpi('Trễ hạn', late.length, 'đơn cần xử lý', '#/don-hang?tab=dang', late.length ? 'red' : '')}
        ${kpi('Sắp hết hàng', low.length, 'mặt hàng dưới ngưỡng', '#/kho?f=low', low.length ? 'amber' : '')}
        ${kpi('Có mặt hôm nay', marked ? `${present}/${emps.length}` : 'Chưa', marked ? 'nhân viên' : 'điểm danh – bấm để làm', can('manage') ? '#/diem-danh' : '#/', marked ? '' : 'blue')}
      </div>
      ${moneyRow}
      <div class="quick">
        ${can('manage') ? `<button class="btn primary" data-act="order-new">${icon('plus')} Tạo đơn hàng</button>` : ''}
        <button class="btn" data-act="receipt-new">${icon('inbox')} Nhập hàng</button>
        <button class="btn" data-act="report-new">${icon('report')} Báo cáo cuối ca</button>
        ${can('manage') ? `<a class="btn" href="#/diem-danh">${icon('att')} Điểm danh</a>` : ''}
      </div>
      ${late.length ? section(`${icon('alert')} Đơn trễ hạn`, `<div class="stack">${late.map(orderCard).join('')}</div>`) : ''}
      ${can('manage') && db.tasks.some(WC.needsReview) ? section('Cần kiểm tra', `<div class="stack">${db.tasks.filter(WC.needsReview).sort((a, b) => (a.status === 'loi' ? -1 : 0) - (b.status === 'loi' ? -1 : 0)).map(x => taskCard(x)).join('')}</div>`, '<a class="link" href="#/giao-viec">Giao việc →</a>') : ''}
      ${section('Công việc hôm nay', todayWork(), can('manage') ? `<button class="btn sm" data-act="task-new">${icon('plus')} Giao việc</button>` : '')}
      ${props.length || openNotes.length ? section('Cần xem', `<div class="card list">
        ${props.map(n => `<a class="li" href="#/ghi-chu" data-act="tab-go" data-key="noteTab" data-val="proposal"><div><b>Đề xuất thay đổi · ${esc(n.by)}</b><small>${esc(n.text)}</small></div><div class="li-r">${chip('Chờ duyệt', 'amber')}</div></a>`).join('')}
        ${openNotes.map(n => `<a class="li" href="#/ghi-chu" data-act="tab-go" data-key="noteTab" data-val="note"><div><b>Ghi chú · ${esc(n.by)}${n.ref ? ' · ' + esc(n.ref) : ''}</b><small>${esc(n.text)}</small></div><div class="li-r">${chip('Chưa xử lý', 'blue')}</div></a>`).join('')}</div>`) : ''}
      ${section('Đang làm', `<div class="stack">${dang.filter(o => !isLate(o, t)).map(orderCard).join('') || empty('Không có đơn nào đang làm.')}</div>`, '<a class="link" href="#/don-hang">Tất cả đơn →</a>')}
      ${section('Sắp hết hàng', low.length ? `<div class="card list">${low.map(i => `
        <div class="li"><div><b>${esc(i.name)}</b><small>${esc(i.sku)} · tồn ${num(i.stock)} ${esc(i.unit)} / ngưỡng ${num(i.threshold)}</small></div>
        <div class="li-r">${i.stock <= 0 ? chip('Hết hàng', 'red') : chip('Sắp hết', 'amber')}<small>Nên đặt ~${num(WC.reorderQty(i))} ${esc(i.unit)}</small><button class="btn sm" data-act="receipt-new" data-item="${i.id}">Nhập</button></div></div>`).join('')}</div>` : empty('Kho đủ hàng.'), '<a class="link" href="#/kho">Kho →</a>')}`;
  },

  orders() {
    const sub = `<div class="seg2" role="tablist"><button role="tab" aria-selected="${ui.ordersSub === 'don'}" data-act="tab" data-key="ordersSub" data-val="don">${icon('orders')}Đơn hàng</button><button role="tab" aria-selected="${ui.ordersSub === 'khach'}" data-act="tab" data-key="ordersSub" data-val="khach">${icon('users')}Khách hàng</button></div>`;
    if (ui.ordersSub === 'khach') return sub + customersList();
    const counts = Object.fromEntries(Object.keys(STATUS).map(k => [k, db.orders.filter(o => o.status === k).length]));
    currentList = () => {
      const q = fold(ui.q);
      const list = db.orders.filter(o => o.status === ui.orderTab && (!q || fold(`${o.code} ${cust(o.customerId).name} ${o.lines.map(l => l.name).join(' ')}`).includes(q)));
      list.sort(['xong', 'huy'].includes(ui.orderTab) ? (a, b) => (b.doneAt || b.start).localeCompare(a.doneAt || a.start) : queueSort);
      return list.map(orderCard).join('') || empty(q ? 'Không tìm thấy đơn phù hợp.' : 'Chưa có đơn ở mục này.');
    };
    return `${sub}${tabs('orderTab', STATUS_TAB, counts)}
      <div class="toolbar">${searchBox('Tìm mã đơn, khách, tên hàng…')}${can('money') ? `<button class="btn" data-act="export-orders">${icon('download')} Xuất Excel</button>` : ''}</div>
      ${ui.orderTab === 'cho' ? `<p class="hint">Hàng chờ xếp theo ưu tiên (G1 cao nhất), rồi ngày kết thúc. Khi một đơn xong, đơn đầu hàng chờ <b>đủ vật tư</b> tự lên “Đang làm” (tối đa ${db.meta.capacity} đơn cùng lúc).</p>` : ''}
      <div class="stack" id="list">${currentList()}</div>`;
  },

  customer(id) {
    const c = db.customers.find(x => x.id === id);
    if (!c) return empty('Không tìm thấy khách hàng.');
    const os = db.orders.filter(o => o.customerId === id).sort((a, b) => b.start.localeCompare(a.start));
    const live = os.filter(o => o.status !== 'huy');
    const total = live.reduce((s, o) => s + orderValue(o), 0), got = live.reduce((s, o) => s + WC.received(o), 0);
    const prods = {};
    for (const o of live) for (const l of o.lines) { const p = (prods[l.name] ||= { qty: 0, last: '' }); p.qty += l.qty; if (o.start > p.last) p.last = o.start; }
    return `
      <a class="back" href="#/don-hang" data-act="tab-go" data-key="ordersSub" data-val="khach">${icon('left')} Khách hàng</a>
      <div class="card profile">
        <div><h2>${esc(c.name)}</h2><p class="muted">${esc(c.code)} · ${esc(c.address) || 'Chưa có địa chỉ'}${c.email ? ' · ' + esc(c.email) : ''}</p>${c.note ? `<p class="note">📝 ${esc(c.note)}</p>` : ''}</div>
        <div class="row-act">${c.phone ? `<a class="btn" href="tel:${esc(c.phone.replace(/\s/g, ''))}">${icon('phone')} ${esc(c.phone)}</a>` : ''}
          ${can('manage') ? `<button class="btn" data-act="cust-edit" data-id="${c.id}">Sửa</button>
          <button class="btn primary" data-act="order-new" data-cust="${c.id}">${icon('plus')} Tạo đơn cho khách này</button>` : ''}</div>
      </div>
      <div class="kpis k3">
        <div class="card kpi"><span>Số đơn</span><b>${live.length}</b></div>
        ${can('money') ? `<div class="card kpi"><span>Tổng giá trị</span><b>${money(total)}</b></div>
        <div class="card kpi ${total - got > 0 ? 'red' : ''}"><span>Còn phải thu</span><b>${money(total - got)}</b></div>` : ''}
      </div>
      ${Object.keys(prods).length ? section('Hay đặt', `<div class="card list">${Object.entries(prods).sort((a, b) => b[1].qty - a[1].qty).map(([nm, p]) => `<div class="li"><div><b>${esc(nm)}</b><small>Lần cuối ${fdate(p.last)}</small></div><div class="li-r"><span>${num(p.qty)} cái</span></div></div>`).join('')}</div>`) : ''}
      ${section('Lịch sử đơn hàng', `<div class="stack">${os.map(orderCard).join('') || empty('Khách chưa có đơn nào.')}</div>`)}`;
  },

  kho() {
    const head = tabs('khoTab', { ton: 'Tồn kho', nhap: 'Phiếu nhập', so: 'Sổ kho' });
    if (ui.khoTab === 'ton') {
      const F = { all: 'Tất cả', material: 'Nguyên vật liệu', finished: 'Thành phẩm', low: 'Sắp hết', ...Object.fromEntries(db.categories.map(k => [k.id, k.name])) };
      currentList = () => {
        const q = fold(ui.q), f = ui.khoFilter;
        const list = db.items.filter(i => (f === 'all' || (f === 'low' ? WC.reorderQty(i) > 0 : f === 'material' || f === 'finished' ? i.type === f : i.categoryId === f))
          && (!q || fold(`${i.sku} ${i.name} ${Object.values(i.attrs || {}).join(' ')}`).includes(q)));
        return list.length ? `<div class="card list">${list.map(i => {
          const st = i.threshold > 0 && i.stock <= 0 ? chip('Hết hàng', 'red') : WC.reorderQty(i) ? chip('Sắp hết', 'amber') : '';
          const k = db.categories.find(x => x.id === i.categoryId);
          const attrs = k ? k.fields.filter(fd => i.attrs?.[fd.key]).map(fd => `${esc(fd.label)}: ${esc(i.attrs[fd.key])}`).join(' · ') : '';
          return `<div class="li"><div><b>${esc(i.name)}</b><small>${esc(i.sku)} · ${k ? esc(k.name) : i.type === 'material' ? 'Nguyên vật liệu' : 'Thành phẩm'}${i.threshold ? ` · ngưỡng ${num(i.threshold)}` : ''}${can('money') && i.lastPrice ? ` · giá nhập ${money(i.lastPrice)}` : ''}</small>${attrs ? `<small>${attrs}</small>` : ''}</div>
            <div class="li-r"><span class="stock">${num(i.stock)} <small>${esc(i.unit)}</small></span>${st}
            <span class="mini-act"><button class="btn sm" data-act="move-new" data-id="${i.id}">Xuất / điều chỉnh</button>${can('manage') ? `<button class="btn sm ghost" data-act="item-edit" data-id="${i.id}">Sửa</button>` : ''}</span></div></div>`;
        }).join('')}</div>` : empty('Không có mặt hàng phù hợp.');
      };
      return `${head}<div class="toolbar">${searchBox('Tìm mã, tên, thuộc tính…')}${can('manage') ? `<button class="btn" data-act="item-new">${icon('plus')} Mặt hàng</button>` : ''}</div>
        <div class="chips">${Object.entries(F).map(([k, l]) => `<button class="fchip" aria-pressed="${ui.khoFilter === k}" data-act="tab" data-key="khoFilter" data-val="${k}">${esc(l)}</button>`).join('')}</div>
        <div id="list">${currentList()}</div>`;
    }
    if (ui.khoTab === 'nhap') {
      currentList = () => {
        const q = fold(ui.q);
        const list = db.receipts.filter(r => !q || fold(`${r.code} ${r.supplier} ${r.lines.map(l => item(l.itemId).name).join(' ')}`).includes(q)).sort((a, b) => b.date.localeCompare(a.date) || b.code.localeCompare(a.code));
        return list.map(r => {
          const total = r.lines.reduce((s, l) => s + l.qty * l.price, 0);
          return `<details class="card order"><summary><div class="o-top"><b class="o-code">${esc(r.code)}</b>${chip(fdate(r.date))}${can('money') ? `<span class="o-val">${money(total)}</span>` : ''}</div>
            <div class="o-cust">${esc(r.supplier)}</div><div class="o-meta">${r.lines.map(l => esc(item(l.itemId).name)).join(', ')}</div>${icon('chev')}</summary>
            <div class="o-body"><div class="tbl"><table><thead><tr><th>Mặt hàng</th><th class="r">SL</th>${can('money') ? '<th class="r">Đơn giá</th><th class="r">Thành tiền</th>' : ''}</tr></thead>
            <tbody>${r.lines.map(l => `<tr><td>${esc(item(l.itemId).name)}</td><td class="r">${num(l.qty)} ${esc(item(l.itemId).unit)}</td>${can('money') ? `<td class="r">${money(l.price)}</td><td class="r">${money(l.qty * l.price)}</td>` : ''}</tr>`).join('')}</tbody></table></div>
            ${r.note ? `<p class="note">📝 ${esc(r.note)}</p>` : ''}<p class="hint">Phiếu đã ghi vào sổ kho – không sửa/xoá. Nhập sai thì dùng “Điều chỉnh”.</p></div></details>`;
        }).join('') || empty('Chưa có phiếu nhập.');
      };
      return `${head}<div class="toolbar">${searchBox('Tìm số phiếu, nhà cung cấp, mặt hàng…')}${can('money') ? `<button class="btn" data-act="export-receipts">${icon('download')} Xuất Excel</button>` : ''}</div><div class="stack" id="list">${currentList()}</div>`;
    }
    currentList = () => {
      const q = fold(ui.q);
      const list = db.moves.filter(m => !q || fold(`${item(m.itemId).name} ${m.ref} ${m.note}`).includes(q)).slice().reverse().sort((a, b) => b.date.localeCompare(a.date));
      return list.length ? `<div class="card tbl"><table><thead><tr><th>Ngày</th><th>Mặt hàng</th><th class="r">Số lượng</th>${can('money') ? '<th class="r">Giá trị</th>' : ''}<th>Loại</th><th>Chứng từ</th><th>Ghi chú</th></tr></thead><tbody>
        ${list.map(m => { const sg = m.type === 'xuat' ? -m.qty : m.qty; return `<tr><td>${fdate(m.date)}</td><td class="wrap">${esc(item(m.itemId).name)}</td><td class="r ${sg < 0 ? 't-red' : 't-green'}">${sg > 0 ? '+' : ''}${num(sg)} ${esc(item(m.itemId).unit)}</td>${can('money') ? `<td class="r">${m.price ? money(Math.abs(sg) * m.price) : '—'}</td>` : ''}<td>${MOVE_L[m.type]}</td><td>${esc(m.ref) || '—'}</td><td class="muted">${esc(m.note)}</td></tr>`; }).join('')}
        </tbody></table></div>` : empty('Chưa có giao dịch.');
    };
    return `${head}<p class="hint">Mọi lần nhập, xuất, điều chỉnh đều ghi một dòng ở đây. Sổ kho chỉ thêm, không sửa hay xoá.</p><div class="toolbar">${searchBox('Tìm mặt hàng, số phiếu, đơn hàng…')}</div><div id="list">${currentList()}</div>`;
  },

  thuchi() {
    const head = tabs('tcTab', { tong: 'Tổng hợp', so: 'Sổ thu chi', don: 'Giá thành đơn', chi: 'Chi phí', hd: 'Hoá đơn' });
    const [from, to] = WC.periodRange(ui.period, ui.pdate), label = periodLabel(ui.period, ui.pdate);
    const pbar = `<div class="pbar"><div class="seg3">${Object.entries({ ngay: 'Ngày', thang: 'Tháng', nam: 'Năm' }).map(([k, l]) => `<button aria-pressed="${ui.period === k}" data-act="period" data-val="${k}">${l}</button>`).join('')}</div>
      <div class="pnav"><button class="icon-btn" data-act="period-shift" data-n="-1" aria-label="Kỳ trước">${icon('left')}</button><b>${label}</b><button class="icon-btn" data-act="period-shift" data-n="1" aria-label="Kỳ sau">${icon('right')}</button></div></div>`;
    const ledger = WC.moneyLedger(db);
    if (ui.tcTab === 'tong') {
      const cf = WC.cashflow(ledger, from, to);
      const due = db.orders.filter(o => o.status !== 'huy').reduce((s, o) => s + Math.max(0, orderValue(o) - WC.received(o)), 0);
      const inOrders = db.orders.filter(o => o.status !== 'huy' && o.createdAt >= from && o.createdAt <= to);
      const outOrders = db.orders.filter(o => o.status === 'xong' && o.doneAt >= from && o.doneAt <= to);
      const outF = outOrders.map(o => WC.finance(o, db.moves));
      const bars = Array.from({ length: 6 }, (_, k) => { const p = WC.shiftPeriod(ui.period, ui.pdate, k - 5), [a, b] = WC.periodRange(ui.period, p), c = WC.cashflow(ledger, a, b); return { l: periodLabel(ui.period, p, true), in: c.in, out: c.out, cur: k === 5 }; });
      const max = Math.max(1, ...bars.flatMap(b => [b.in, b.out]));
      const kinds = Object.entries(cf.byKind).sort((a, b) => b[1] - a[1]);
      return `${head}${pbar}
        <div class="kpis">
          <div class="card kpi"><span>Tiền thu vào</span><b class="t-green">${money(cf.in)}</b><small>cọc + thanh toán của khách</small></div>
          <div class="card kpi"><span>Tiền chi ra</span><b class="t-red">${money(cf.out)}</b><small>mua vật tư + chi phí</small></div>
          <div class="card kpi"><span>Chênh lệch</span><b class="${cf.net < 0 ? 't-red' : ''}">${money(cf.net)}</b><small>thu − chi trong kỳ</small></div>
          <div class="card kpi amber"><span>Khách còn nợ</span><b>${money(due)}</b><small>tất cả đơn, không theo kỳ</small></div>
        </div>
        <div class="grid2 sec">
          <div class="card pad"><h3 class="h3">Đơn nhận vào</h3><p class="big">${inOrders.length} đơn · ${money(inOrders.reduce((s, o) => s + orderValue(o), 0))}</p><p class="hint">Đơn tạo trong kỳ (không tính đơn huỷ).</p></div>
          <div class="card pad"><h3 class="h3">Đơn giao ra (hoàn thành)</h3><p class="big">${outOrders.length} đơn · ${money(outF.reduce((s, f) => s + f.value, 0))}</p>
            <p class="hint">Giá vốn ${money(outF.reduce((s, f) => s + f.cost, 0))} · Lãi <b class="${outF.reduce((s, f) => s + f.profit, 0) < 0 ? 't-red' : 't-green'}">${money(outF.reduce((s, f) => s + f.profit, 0))}</b></p></div>
        </div>
        ${section('Thu – chi 6 kỳ gần nhất', `<div class="card pad chart" role="img" aria-label="Biểu đồ thu chi">
          ${bars.map(b => `<div class="bar-g${b.cur ? ' cur' : ''}"><div class="bars"><i class="in" style="height:${(b.in / max) * 100}%" title="Thu ${money(b.in)}"></i><i class="out" style="height:${(b.out / max) * 100}%" title="Chi ${money(b.out)}"></i></div><small>${b.l}</small></div>`).join('')}
          <div class="legend"><span><i class="in"></i>Thu</span><span><i class="out"></i>Chi</span></div></div>`)}
        ${section('Chi theo loại', kinds.length ? `<div class="card pad">${kinds.map(([k, v]) => `<div class="hbar"><span>${esc(k)}</span><div><i style="width:${(v / cf.out) * 100}%"></i></div><b>${money(v)}</b></div>`).join('')}</div>` : empty('Không có khoản chi trong kỳ.'))}`;
    }
    if (ui.tcTab === 'so') {
      currentList = () => {
        const q = fold(ui.q);
        const rows = ledger.filter(r => r.date >= from && r.date <= to && (ui.ledgerDir === 'all' || r.dir === ui.ledgerDir) && (!q || fold(`${r.kind} ${r.label} ${r.ref} ${r.note}`).includes(q)));
        const tin = rows.filter(r => r.dir === 'in').reduce((s, r) => s + r.amount, 0), tout = rows.filter(r => r.dir === 'out').reduce((s, r) => s + r.amount, 0);
        return rows.length ? `<div class="card tbl"><table><thead><tr><th>Ngày</th><th>Loại</th><th>Nội dung</th><th>Hình thức</th><th class="r">Thu</th><th class="r">Chi</th></tr></thead><tbody>
          ${rows.map(r => `<tr><td>${fdate(r.date)}</td><td>${chip(r.kind, r.dir === 'in' ? 'green' : 'red')}</td><td class="wrap">${esc(r.label)}${r.note ? `<small class="muted"> · ${esc(r.note)}</small>` : ''}</td><td>${METHOD_L[r.method] || ''}</td><td class="r t-green">${r.dir === 'in' ? money(r.amount) : ''}</td><td class="r t-red">${r.dir === 'out' ? money(r.amount) : ''}</td></tr>`).join('')}
          </tbody><tfoot><tr><th colspan="4">Cộng ${rows.length} dòng · chênh lệch ${money(tin - tout)}</th><th class="r t-green">${money(tin)}</th><th class="r t-red">${money(tout)}</th></tr></tfoot></table></div>` : empty('Không có khoản thu chi nào trong kỳ.');
      };
      return `${head}${pbar}<div class="toolbar">${searchBox('Tìm đơn, khách, nhà cung cấp…')}
        <div class="seg3">${Object.entries({ all: 'Tất cả', in: 'Tiền vào', out: 'Tiền ra' }).map(([k, l]) => `<button aria-pressed="${ui.ledgerDir === k}" data-act="tab" data-key="ledgerDir" data-val="${k}">${l}</button>`).join('')}</div>
        <button class="btn" data-act="export-ledger">${icon('download')} Xuất Excel</button></div><div id="list">${currentList()}</div>`;
    }
    if (ui.tcTab === 'don') {
      const rows = db.orders.filter(o => o.status !== 'huy').sort((a, b) => b.code.localeCompare(a.code)).map(o => ({ o, f: WC.finance(o, db.moves) }));
      const sum = k => rows.reduce((s, r) => s + r.f[k], 0);
      return `${head}<p class="hint">Giá vốn = vật tư đã xuất kho cho đơn (theo giá nhập) + các chi phí khác nhập ở từng đơn (nhân công, vận chuyển…). Lãi “tạm tính” cho tới khi chốt giá thành.</p>
        <div class="toolbar"><button class="btn" data-act="export-costing">${icon('download')} Xuất Excel</button></div>
        <div class="card tbl costing"><table><thead><tr><th>Đơn</th><th>Khách</th><th>Trạng thái</th><th class="r">Giá trị</th><th class="r">Cọc YC</th><th class="r">Đã thu</th><th class="r">Còn lại</th><th class="r">Vật tư</th><th class="r">CP khác</th><th class="r">Giá vốn</th><th class="r">Lãi</th><th class="r">Biên</th></tr></thead><tbody>
        ${rows.map(({ o, f }) => `<tr data-act="goto-order" data-id="${o.id}" class="click"><td><b>${esc(o.code)}</b></td><td class="wrap">${esc(cust(o.customerId).name)}</td><td>${chip(STATUS_TAB[o.status], STATUS_C[o.status])}${o.costFinal ? '' : ' <small class="t-amber">tạm</small>'}</td>
          <td class="r">${money(f.value)}</td><td class="r">${money(f.deposit)}${f.deposit && !f.depositOk ? ' <b class="t-red">!</b>' : ''}</td><td class="r t-green">${money(f.received)}</td><td class="r ${f.balance > 0 ? 't-red' : ''}">${money(f.balance)}</td>
          <td class="r">${money(f.mat)}</td><td class="r">${money(f.extra)}</td><td class="r">${money(f.cost)}</td><td class="r ${f.profit < 0 ? 't-red' : 't-green'}">${money(f.profit)}</td><td class="r">${pct(f.margin)}</td></tr>`).join('')}
        </tbody><tfoot><tr><th colspan="3">Tổng ${rows.length} đơn</th><th class="r">${money(sum('value'))}</th><th class="r">${money(sum('deposit'))}</th><th class="r">${money(sum('received'))}</th><th class="r">${money(sum('balance'))}</th><th class="r">${money(sum('mat'))}</th><th class="r">${money(sum('extra'))}</th><th class="r">${money(sum('cost'))}</th><th class="r">${money(sum('profit'))}</th><th class="r">${pct(sum('value') ? sum('profit') / sum('value') : 0)}</th></tr></tfoot></table></div>`;
    }
    if (ui.tcTab === 'chi') {
      const list = db.expenses.filter(e => e.date >= from && e.date <= to).sort((a, b) => b.date.localeCompare(a.date));
      return `${head}${pbar}<div class="toolbar"><button class="btn primary" data-act="expense-new">${icon('plus')} Khoản chi</button><span class="hint">Tiền mua vật tư được tính tự động từ phiếu nhập kho.</span></div>
        ${list.length ? `<div class="card list">${list.map(e => `<div class="li"><div><b>${esc(e.category)}</b><small>${fdate(e.date)} · ${esc(e.note)}${e.orderRef ? ' · ' + esc(e.orderRef) : ''}</small></div><div class="li-r"><b class="t-red">${money(e.amount)}</b><button class="btn sm ghost t-red" data-act="expense-del" data-id="${e.id}">Xoá</button></div></div>`).join('')}
          <div class="li tot"><b>Tổng</b><b class="t-red">${money(list.reduce((s, e) => s + e.amount, 0))}</b></div></div>` : empty('Chưa có khoản chi trong kỳ.')}`;
    }
    const bills = db.bills.slice().sort((a, b) => b.code.localeCompare(a.code));
    return `${head}<div class="toolbar"><span class="hint">Tạo hoá đơn từ trong từng đơn hàng (mục “Tiền của đơn”). Hoá đơn đã phát hành không sửa được – sai thì huỷ và tạo lại.</span><button class="btn" data-act="export-bills">${icon('download')} Xuất Excel</button></div>
      ${bills.length ? `<div class="card list">${bills.map(b => { const o = order(b.orderId), total = b.snap.lines.reduce((s, l) => s + l.qty * l.price, 0), pay = billPay(b, o);
        return `<div class="li"><div><b>${esc(b.code)} · ${esc(b.snap.customer.name)}</b><small>${fdate(b.date)} · đơn ${esc(b.snap.orderCode)} · hạn thanh toán ${fdate(b.dueDate)}</small></div>
        <div class="li-r"><b>${money(total)}</b><span class="row">${chip(BILL_L[b.status], { nhap: 'slate', phathanh: 'blue', huy: 'ghost' }[b.status])}${b.status === 'phathanh' ? chip(pay.l, pay.c) : ''}</span><button class="btn sm" data-act="bill-view" data-id="${b.id}">${icon('print')}Xem / in</button></div></div>`; }).join('')}</div>` : empty('Chưa có hoá đơn.')}`;
  },

  att() {
    const head = tabs('attTab', { ngay: 'Theo ngày', thang: 'Bảng công tháng' }), emps = byGroup(activeEmps());
    if (ui.attTab === 'ngay') {
      const d = ui.attDate, day = db.att[d] || {};
      const cnt = Object.fromEntries(Object.keys(ATT).map(k => [k, emps.filter(e => day[e.id]?.s === k).length]));
      const future = d > today();
      return `${head}
        <div class="datebar"><button class="icon-btn" data-act="att-day" data-n="-1" aria-label="Ngày trước">${icon('left')}</button>
          <label><span class="sr">Chọn ngày</span><input type="date" value="${d}" data-change="att-date"></label>
          <button class="icon-btn" data-act="att-day" data-n="1" aria-label="Ngày sau">${icon('right')}</button>
          <b>${weekday(d)}${d === today() ? ' · Hôm nay' : ''}</b></div>
        <div class="chips">${Object.entries(ATT).map(([k, a]) => chip(`${a.l}: ${cnt[k]}`, a.c)).join('')}${chip(`Chưa chấm: ${emps.length - Object.values(cnt).reduce((a, b) => a + b, 0)}`, 'ghost')}</div>
        ${future ? '<p class="hint">Không chấm công cho ngày trong tương lai.</p>' : `<div class="toolbar"><button class="btn" data-act="att-all">${icon('check')} Đánh dấu cả xưởng có mặt</button><span class="hint">Chỉ điền cho người chưa chấm. Giờ vào mặc định ${esc(db.meta.shiftStart)}. Bấm lại nút đang chọn để bỏ.</span></div>`}
        <div class="card list att">${emps.map((e, i) => {
          const r = day[e.id], g = group(e.groupId);
          const head = i === 0 || emps[i - 1].groupId !== e.groupId
            ? `<div class="li grp-h" style="--c:${g.color}"><span class="dot"></span><b>${esc(g.name)}</b><small>${members(e.groupId).length} người</small>${future ? '' : `<button class="btn sm ghost" data-act="att-all" data-g="${e.groupId || ''}">Cả tổ có mặt</button>`}</div>` : '';
          return `${head}<div class="li att-row"><div><b>${esc(e.name)}</b><small>${esc(e.code)} · ${esc(e.role)}</small></div>
            <div class="seg" role="group" aria-label="Trạng thái của ${esc(e.name)}">${Object.entries(ATT).map(([k, a]) => `<button class="${a.c}" aria-pressed="${r?.s === k}" data-act="att-set" data-e="${e.id}" data-s="${k}" ${future ? 'disabled' : ''}>${a.s}</button>`).join('')}</div>
            <div class="times">${r && ATT[r.s].w ? `<label>Vào <input type="time" value="${esc(r.in)}" data-change="att-time" data-e="${e.id}" data-f="in"></label><label>Ra <input type="time" value="${esc(r.out)}" data-change="att-time" data-e="${e.id}" data-f="out"></label>` : ''}</div>
          </div>`;
        }).join('')}</div>`;
    }
    const [y, m] = ui.month.split('-').map(Number), days = new Date(y, m, 0).getDate();
    const cols = Array.from({ length: days }, (_, i) => `${ui.month}-${String(i + 1).padStart(2, '0')}`);
    return `${head}
      <div class="toolbar"><label class="inline">Tháng <input type="month" value="${ui.month}" data-change="att-month"></label><button class="btn" data-act="export-att">${icon('download')} Xuất Excel</button></div>
      <p class="hint">✓ có mặt · M đi muộn · ½ nửa ngày · P nghỉ phép · ✗ vắng. Công = có mặt + muộn + ½ × nửa ngày.</p>
      <div class="card tbl attsheet"><table><thead><tr><th class="stick">Nhân viên</th>${cols.map(c => `<th class="${new Date(c + 'T00:00:00').getDay() === 0 ? 'sun' : ''}">${+c.slice(8)}</th>`).join('')}<th>Công</th><th>Muộn</th><th>Phép</th><th>Vắng</th></tr></thead>
      <tbody>${emps.map(e => { const t = WC.attTotals(db.att, e.id, ui.month); return `<tr><th class="stick">${esc(e.name)}</th>${cols.map(c => { const r = db.att[c]?.[e.id]; return `<td class="${r ? 'c-' + ATT[r.s].c : ''}">${r ? ATT[r.s].sym : ''}</td>`; }).join('')}<td class="r"><b>${num(t.cong)}</b></td><td class="r">${t.muon}</td><td class="r">${t.phep}</td><td class="r">${t.vang}</td></tr>`; }).join('')}</tbody></table></div>`;
  },

  reports() {
    const list = db.reports.slice().sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt));
    return `<p class="hint">Mỗi ca, người phụ trách gửi một báo cáo: số lượng làm xong theo đơn, hàng lỗi, ghi chú và ảnh chụp. Sửa báo cáo cần ghi lý do, bản cũ vẫn được giữ.</p>
      <div class="stack">${list.map(r => `<article class="card pad report">
        <div class="o-top"><b>${fdate(r.date)}</b>${chip(r.by, 'blue')}${r.history.length ? chip(`Đã sửa ${r.history.length} lần`, 'amber') : ''}<span class="o-val muted">${esc(r.createdAt.slice(11))}</span></div>
        ${r.lines.length ? `<div class="tbl"><table><thead><tr><th>Đơn</th><th>Công đoạn</th><th class="r">Làm xong</th><th class="r">Lỗi</th></tr></thead><tbody>
          ${r.lines.map(l => `<tr><td>${esc(order(l.orderId)?.code || '—')}</td><td>${esc(l.step) || '—'}</td><td class="r">${num(l.done)}</td><td class="r ${l.defects ? 't-red' : ''}">${num(l.defects)}</td></tr>`).join('')}</tbody></table></div>` : ''}
        ${r.note ? `<p class="note">📝 ${esc(r.note)}</p>` : ''}
        ${r.photos.length ? `<div class="photos">${r.photos.map((p, k) => `<button class="ph" data-act="photo" data-id="${r.id}" data-k="${k}" aria-label="Xem ảnh ${k + 1}"><img src="${p}" alt="Ảnh báo cáo ${k + 1}" loading="lazy"></button>`).join('')}</div>` : ''}
        ${r.history.length ? `<details class="hist"><summary>Lịch sử sửa</summary>${r.history.map(h => `<p class="hint">${esc(h.at)} · lý do: ${esc(h.reason)}</p>`).join('')}</details>` : ''}
        <div class="row-act"><button class="btn sm ghost" data-act="report-edit" data-id="${r.id}">Sửa (ghi lý do)</button></div>
      </article>`).join('') || empty('Chưa có báo cáo nào.')}</div>`;
  },

  notes() {
    const head = tabs('noteTab', { note: 'Ghi chú chung', proposal: 'Đề xuất thay đổi' });
    if (ui.noteTab === 'note') {
      const open = db.notes.filter(n => n.type === 'note' && n.status === 'open'), done = db.notes.filter(n => n.type === 'note' && n.status !== 'open');
      return `${head}<div class="toolbar"><button class="btn primary" data-act="note-new" data-type="note">${icon('plus')} Ghi chú</button><span class="hint">Gắn với đơn, khách hoặc mặt hàng để mọi người cùng thấy.</span></div>
        <div class="stack">${open.map(noteCard).join('') || empty('Không có ghi chú cần xử lý.')}</div>
        ${done.length ? `<details class="sec hist"><summary>Đã xử lý (${done.length})</summary><div class="stack">${done.map(noteCard).join('')}</div></details>` : ''}`;
    }
    const isOpen = WC.proposalOpen(new Date(), db.meta.shiftStart) || db.meta.ignoreLock;
    const [h, m] = db.meta.shiftStart.split(':').map(Number), until = `${String(h + Math.floor((m + 30) / 60)).padStart(2, '0')}:${String((m + 30) % 60).padStart(2, '0')}`;
    const pend = db.notes.filter(n => n.type === 'proposal' && n.status === 'open'), past = db.notes.filter(n => n.type === 'proposal' && n.status !== 'open');
    return `${head}<div class="alert ${isOpen ? 'green' : 'slate'}">${icon(isOpen ? 'check' : 'alert')}<div><b>${isOpen ? `Đang mở nhận đề xuất – khoá lúc ${until}` : `Đã khoá – mở lại trước ca ngày mai (đến ${until})`}</b>
      <span>Đề xuất thay đổi chỉ gửi được trước ca hoặc trong 30 phút đầu ca.${db.meta.ignoreLock ? ' (Demo: đang bỏ qua khoá giờ)' : ''}</span></div></div>
      <div class="toolbar"><button class="btn primary" data-act="note-new" data-type="proposal" ${isOpen ? '' : 'disabled'}>${icon('plus')} Gửi đề xuất</button></div>
      <div class="stack">${pend.map(noteCard).join('') || empty('Không có đề xuất chờ duyệt.')}</div>
      ${past.length ? `<details class="sec hist"><summary>Đã duyệt / từ chối (${past.length})</summary><div class="stack">${past.map(noteCard).join('')}</div></details>` : ''}`;
  },

  settings() {
    return `
      ${section('Xưởng', `<form class="card pad form" data-form="meta">
        <div class="grid2"><label>Tên xưởng <input name="name" required maxlength="120" value="${esc(db.meta.name)}"></label>
        <label>Giờ vào ca <input type="time" name="shiftStart" value="${esc(db.meta.shiftStart)}"></label></div>
        <label>Số đơn làm song song tối đa <input type="number" name="capacity" min="1" max="50" value="${db.meta.capacity}"><small class="hint">Vượt số này trong lịch sẽ báo đỏ “Lịch kín”. Cũng dùng khi tự đôn đơn từ hàng chờ.</small></label>
        <label class="switch"><input type="checkbox" name="ignoreLock" ${db.meta.ignoreLock ? 'checked' : ''}><span>Demo: bỏ qua khoá giờ của “Đề xuất thay đổi”</span></label>
        <div><button class="btn primary">Lưu</button></div></form>`)}
      ${section('Công đoạn mẫu (block)', `<p class="hint">Tạo sẵn các công đoạn hay dùng. Khi tạo đơn, bật “Quy trình sản xuất” rồi bấm chọn block theo thứ tự – không bắt buộc với mọi đơn.</p>
        <div class="card list">${db.blocks.map((b, i) => `<div class="li"><div class="blk"><span class="dot" style="--c:${b.color}"></span><div><b>${esc(b.name)}</b><small>${b.days} ngày dự kiến${b.note ? ' · ' + esc(b.note) : ''}</small></div></div>
          <div class="li-r row"><button class="icon-btn sm" data-act="block-move" data-id="${b.id}" data-n="-1" aria-label="Đưa ${esc(b.name)} lên" ${i ? '' : 'disabled'}>${icon('up')}</button><button class="icon-btn sm" data-act="block-move" data-id="${b.id}" data-n="1" aria-label="Đưa ${esc(b.name)} xuống" ${i < db.blocks.length - 1 ? '' : 'disabled'}>${icon('chev')}</button>
          <button class="btn sm ghost" data-act="block-edit" data-id="${b.id}">Sửa</button><button class="btn sm ghost t-red" data-act="block-del" data-id="${b.id}">Xoá</button></div></div>`).join('') || empty('Chưa có block nào.')}</div>`,
        `<button class="btn sm" data-act="block-new">${icon('plus')} Block</button>`)}
      ${section('Danh mục kho', `<p class="hint">Mỗi danh mục có các trường riêng, ví dụ gỗ có “Loại gỗ”, “Độ dày”; vải có “Màu”.</p>
        <div class="card list">${db.categories.map(k => `<div class="li"><div><b>${esc(k.name)}</b><small>${k.fields.map(f => esc(f.label)).join(' · ') || 'Không có trường riêng'} · ${db.items.filter(i => i.categoryId === k.id).length} mặt hàng</small></div><div class="li-r"><button class="btn sm ghost" data-act="cat-edit" data-id="${k.id}">Sửa</button></div></div>`).join('')}</div>`,
        `<button class="btn sm" data-act="cat-new">${icon('plus')} Danh mục</button>`)}
      ${section('Nhân viên & tổ', `<p class="hint">Chia công nhân thành các tổ. Mỗi tổ có một kênh chat riêng; giao việc cho cả tổ thì ai trong tổ cũng nhận được thông báo.</p>
        <div class="row-act" style="margin:0 0 12px">${db.groups.map(g => `<button class="block-btn" style="--c:${g.color}" data-act="group-edit" data-id="${g.id}">${esc(g.name)} · ${members(g.id).length}</button>`).join('')}<button class="btn sm" data-act="group-new">${icon('plus')} Tổ</button></div>
        <div class="card list">${byGroup(db.employees).map(e => `<div class="li"><div class="blk"><span class="dot" style="--c:${group(e.groupId).color}"></span><div><b>${esc(e.name)}</b><small>${esc(e.code)} · ${esc(group(e.groupId).name)} · ${esc(e.role)} · ${esc(e.phone)}</small></div></div><div class="li-r">${e.active ? chip('Đang làm', 'green') : chip('Đã nghỉ', 'ghost')}<button class="btn sm ghost" data-act="emp-edit" data-id="${e.id}">Sửa</button></div></div>`).join('')}</div>`, `<button class="btn sm" data-act="emp-new">${icon('plus')} Nhân viên</button>`)}
      ${section('Dữ liệu', `<div class="card pad stack">
        <div><b>Nhập từ Excel</b><p class="hint">Tạo nhanh danh sách mặt hàng hoặc khách hàng từ file Excel (.xlsx) hoặc CSV. Tải file mẫu để xem đúng tên cột.</p>
        <div class="row-act"><label class="btn">${icon('inbox')} Nhập mặt hàng<input type="file" accept=".xlsx,.xls,.csv" hidden data-change="import-items"></label><button class="btn ghost" data-act="tpl-items">Tải mẫu mặt hàng</button>
        <label class="btn">${icon('inbox')} Nhập khách hàng<input type="file" accept=".xlsx,.xls,.csv" hidden data-change="import-customers"></label><button class="btn ghost" data-act="tpl-customers">Tải mẫu khách hàng</button></div></div>
        <div><b>Sao lưu</b><p class="hint">${LIVE.on ? 'Dữ liệu lưu trên máy chủ Cloudflare và đồng bộ giữa các máy. Tải file sao lưu định kỳ để giữ một bản riêng.' : 'Bản mockup: dữ liệu chỉ lưu trong trình duyệt này, chưa có tài khoản hay máy chủ.'}</p>
        <div class="row-act"><button class="btn" data-act="export-json">${icon('download')} Sao lưu (JSON)</button>
        ${LIVE.on ? '' : `<label class="btn">Khôi phục từ file<input type="file" accept="application/json" hidden data-change="import-json"></label>
        <button class="btn danger" data-act="reset">Đặt lại dữ liệu mẫu</button>`}</div></div></div>`)}`;
  },

  more() {
    const items = navFor(role()).filter(n => !bottomFor(role()).includes(n));
    return `<div class="tiles">${items.map(n => `<a class="card tile" href="#/${n.h}">${icon(n.ic)}<b>${n.l}</b><small>${n.d}</small></a>`).join('')}</div>
      ${LIVE.on ? section('Tài khoản của tôi', `<div class="card pad stack">${roleSelect()}<div class="row-act"><button class="btn" data-act="pw-change">${icon('key')} Đổi mật khẩu</button><button class="btn danger" data-act="logout">${icon('logout')} Đăng xuất</button></div><p class="hint">Đổi mật khẩu sẽ đăng xuất bạn trên các máy khác.</p></div>`) : section('Vai trò (demo)', `<div class="card pad">${roleSelect()}<p class="hint">Bản thật: mỗi người đăng nhập tài khoản riêng do chủ xưởng cấp quyền. Chọn “Nhân viên: …” để xem đúng màn hình của người đó (việc được giao, thông báo, kênh tổ). Nhân viên không thấy tiền; người nhập liệu không thấy giá vốn, lãi và thu chi.</p></div>`)}
      ${section('Thông báo trên máy', `<div class="card pad"><p class="hint">${!('Notification' in window) ? 'Trình duyệt này không hỗ trợ thông báo.' : Notification.permission === 'granted' ? 'Đã bật. Khi có việc mới hoặc tin nhắn cho bạn, máy sẽ hiện thông báo.' : Notification.permission === 'denied' ? 'Đã bị chặn – mở cài đặt trình duyệt để cho phép lại.' : 'Bật để điện thoại hiện thông báo khi có việc mới, tin nhắn, báo lỗi.'}</p>
        ${'Notification' in window && Notification.permission === 'default' ? `<div class="row-act"><button class="btn primary" data-act="notif-perm">Bật thông báo</button></div>` : ''}
        <p class="hint">Bản mockup chỉ báo trên chính máy đang mở. Gửi thông báo tới điện thoại người khác cần máy chủ (Web Push).</p></div>`)}
      ${section('Cài lên điện thoại', `<div class="card pad"><p>Android (Chrome): menu ⋮ → <b>Cài đặt ứng dụng</b>. iPhone (Safari): nút Chia sẻ → <b>Thêm vào MH chính</b>.</p>
        <button class="btn primary" data-act="install" ${window.__installEvt ? '' : 'hidden'} id="installBtn">Cài Warecon</button></div>`)}`;
  },
};

function customersList() {
  currentList = () => {
    const q = fold(ui.q);
    const rows = db.customers.filter(c => !q || fold(`${c.code} ${c.name} ${c.phone} ${c.address} ${c.email}`).includes(q)).map(c => {
      const os = db.orders.filter(o => o.customerId === c.id && o.status !== 'huy');
      const debt = os.reduce((s, o) => s + orderValue(o) - WC.received(o), 0);
      return `<a class="li" href="#/khach-hang/${c.id}"><div><b>${esc(c.name)}</b><small>${esc(c.code)} · ${esc(c.phone || 'chưa có SĐT')} · ${esc(c.address)}</small></div>
        <div class="li-r"><span>${os.length} đơn</span>${!can('money') ? '' : debt > 0 ? `<small class="t-red">Còn nợ ${money(debt)}</small>` : '<small>Đã thanh toán đủ</small>'}</div></a>`;
    });
    return rows.length ? `<div class="card list">${rows.join('')}</div>` : empty('Không tìm thấy khách hàng.');
  };
  return `<div class="toolbar">${searchBox('Tìm tên, SĐT, địa chỉ…')}${can('manage') ? `<button class="btn" data-act="cust-new">${icon('plus')} Khách mới</button>` : ''}</div><div id="list">${currentList()}</div>`;
}

function todayWork() {
  const t = today(), rows = [];
  for (const o of db.orders.filter(x => x.status === 'dang').sort(queueSort)) {
    const c = WC.currentStep(o.process), step = c >= 0 ? o.process.steps[c] : null;
    const tasks = db.tasks.filter(w => w.orderId === o.id && w.date === t && (role() !== 'staff' || WC.taskVisibleTo(w, db.meta.meId, meEmp()?.groupId)));
    rows.push(`<div class="work"><div class="work-h"><a href="#/don-hang" data-act="goto-order" data-id="${o.id}"><b>${esc(o.code)}</b></a>${priChip(o.priority)}<span class="muted">${esc(cust(o.customerId).name)}</span></div>
      ${step ? `<div class="work-step" style="--c:${step.color}"><span class="dot"></span><span>Công đoạn <b>${esc(step.name)}</b>${step.status === 'cho' ? ' · chưa bắt đầu' : ''}</span>
        <button class="btn sm ${step.status === 'dang' ? 'primary' : ''}" data-act="${step.status === 'dang' ? 'step-done' : 'step-start'}" data-id="${o.id}">${step.status === 'dang' ? 'Xong công đoạn' : 'Bắt đầu'}</button></div>` : ''}
      ${tasks.map(w => `<a class="task-row" href="#/giao-viec"><span class="chip ${TASK_ST[w.status][1]}">${TASK_ST[w.status][0]}</span><span>${esc(w.text)}</span><small>${esc(w.empId ? emp(w.empId).name : 'Cả ' + group(w.groupId).name)}</small></a>`).join('')}
      ${!step && !tasks.length ? `<p class="hint">Chưa có việc cho hôm nay. ${can('manage') ? `<a href="#" data-act="task-new" data-order="${o.id}">Giao việc</a>` : ''}</p>` : ''}</div>`);
  }
  return rows.length ? `<div class="card work-list">${rows.join('')}</div>` : empty('Không có đơn đang làm.');
}

/* ---------- assigned work + group chat ---------- */
const photoStrip = (list, kind, idv) => (list?.length ? `<div class="photos">${list.map((p, k) => `<button class="ph" data-act="photo" data-kind="${kind}" data-id="${idv}" data-k="${k}" aria-label="Xem ảnh ${k + 1}"><img src="${p}" alt="Ảnh ${k + 1}" loading="lazy"></button>`).join('')}</div>` : '');

function taskCard(t, compact) {
  const o = t.orderId && order(t.orderId), g = group(t.groupId), mine = role() === 'staff' && (t.acceptedBy === db.meta.meId || t.empId === db.meta.meId);
  const st = TASK_ST[t.status], time = s => (s ? s.slice(11) + (s.slice(0, 10) !== today() ? ' ' + fdate(s.slice(0, 10)).slice(0, 5) : '') : '');
  let acts = '';
  if (role() === 'staff') {
    if (t.status === 'moi') acts = `<button class="btn primary" data-act="task-accept" data-id="${t.id}">${icon('check')}Xác nhận nhận việc</button>`;
    else if (t.status === 'nhan' && mine) acts = `<button class="btn primary" data-act="task-done" data-id="${t.id}">${icon('check')}Đã xong</button><button class="btn danger" data-act="task-issue" data-id="${t.id}">${icon('report')}Báo lỗi</button>`;
  } else if (can('manage')) {
    if (WC.needsReview(t)) acts = `<button class="btn primary" data-act="task-ok" data-id="${t.id}">${icon('check')}${t.status === 'loi' ? 'Đã xử lý xong' : 'Đạt, đã kiểm tra'}</button><button class="btn" data-act="task-redo" data-id="${t.id}">Yêu cầu làm lại</button>`;
    else if (t.status === 'moi' || t.status === 'nhan') acts = `<button class="btn ghost t-red" data-act="task-cancel" data-id="${t.id}">Huỷ việc</button>`;
  }
  return `<article class="card task-card st-${t.status}${compact ? ' compact' : ''}" style="--c:${g.color}">
    <div class="o-top"><b class="o-code">${esc(t.code)}</b>${chip(st[0], st[1])}${WC.needsReview(t) ? chip('Chờ chủ xưởng kiểm tra', 'amber') : t.review?.ok ? chip('Đã kiểm tra', 'green') : ''}${o ? `<a class="chip ghost" href="#/don-hang" data-act="goto-order" data-id="${o.id}">${esc(o.code)}</a>` : ''}<span class="o-val muted">${fdate(t.date)}</span></div>
    <p class="tk-text">${esc(t.text)}</p>
    <div class="tk-meta"><span class="tk-who"><span class="dot"></span>${t.empId ? esc(emp(t.empId).name) : `Cả ${esc(g.name)}`}${t.empId ? ` · ${esc(g.name)}` : ''}</span>
      <span>Giao ${time(t.createdAt)}</span>${t.acceptedAt ? `<span>Nhận ${time(t.acceptedAt)}</span>` : ''}${t.doneAt ? `<span>${t.status === 'loi' ? 'Báo lỗi' : 'Xong'} ${time(t.doneAt)}</span>` : ''}</div>
    ${t.issue ? `<div class="issue"><b>${icon('alert')} Lỗi báo lên</b><p>${esc(t.issue.text)}</p>${photoStrip(t.issue.photos, 'task', t.id) || '<small class="muted">Không kèm ảnh</small>'}</div>` : ''}
    ${t.review && !t.review.ok ? `<p class="note">↩ Chủ xưởng yêu cầu làm lại: ${esc(t.review.note)}</p>` : ''}
    ${t.review?.ok && t.review.note ? `<p class="hint">Ghi chú kiểm tra: ${esc(t.review.note)}</p>` : ''}
    ${acts ? `<div class="row-act">${acts}</div>` : ''}
  </article>`;
}

function chatThread(ch) {
  const msgs = db.messages.filter(m => m.ch === ch.id).sort((a, b) => a.at.localeCompare(b.at));
  let lastDay = '';
  return `<div class="chat-h" style="--c:${ch.color}"><button class="icon-btn chat-back" data-act="channel" data-id="" aria-label="Danh sách kênh">${icon('left')}</button><span class="dot"></span><div><b>${esc(ch.name)}</b><small>${ch.id === 'all' ? `${activeEmps().length} người + chủ xưởng` : members(ch.id).map(e => e.name.split(' ').pop()).join(', ')}</small></div>
      ${can('manage') && ch.id !== 'all' ? `<button class="btn sm primary" data-act="task-new" data-group="${ch.id}">${icon('plus')}Giao việc</button>` : ''}</div>
    <div class="chat-body" id="chatBody">${msgs.map(m => {
      const day = m.at.slice(0, 10), sep = day !== lastDay ? `<div class="chat-day">${day === today() ? 'Hôm nay' : fdate(day)}</div>` : ''; lastDay = day;
      const t = m.taskId && db.tasks.find(x => x.id === m.taskId);
      if (t) return `${sep}<div class="msg sys"><small>${esc(who(m.from))} giao việc · ${m.at.slice(11)}</small>${taskCard(t, true)}</div>`;
      const mineM = m.from === me();
      return `${sep}<div class="msg ${mineM ? 'mine' : ''}">${mineM ? '' : `<small class="msg-who">${esc(who(m.from))}</small>`}<div class="bubble">${m.photo ? `<button class="ph big" data-act="photo" data-kind="msg" data-id="${m.id}" data-k="0"><img src="${m.photo}" alt="Ảnh gửi kèm"></button>` : ''}${m.text ? `<p>${esc(m.text)}</p>` : ''}</div><small class="msg-time">${m.at.slice(11)}</small></div>`;
    }).join('') || empty('Chưa có tin nhắn.')}</div>
    <form class="composer" data-form="msg" data-ch="${ch.id}"><label class="icon-btn" aria-label="Gửi ảnh">${icon('report')}<input type="file" accept="image/*" capture="environment" hidden data-change="msg-photo"></label>
      <input name="text" autocomplete="off" placeholder="Nhắn cho ${esc(ch.name)}…" maxlength="1000"><button class="btn primary" aria-label="Gửi">${icon('send')}</button></form>`;
}

// Accounts live on the server; the list loads after the page renders.
views.accounts = () => {
  if (!LIVE.on) return `<div class="alert slate">${icon('alert')}<div><b>Bản demo chưa có tài khoản thật.</b><span>Khi chạy trên máy chủ (Cloudflare), chủ xưởng hoặc người nhập liệu tạo tài khoản cho từng người ở trang này.</span></div></div>`;
  setTimeout(loadAccounts, 0);
  return `<p class="hint">Không có trang tự đăng ký: chỉ chủ xưởng và người nhập liệu tạo được tài khoản${can('owner') ? '' : ' (người nhập liệu chỉ tạo được tài khoản nhân viên)'}. Khoá tài khoản hoặc đặt lại mật khẩu sẽ đăng xuất người đó trên mọi máy.</p>
    <div id="accList">${empty('Đang tải danh sách…')}</div>`;
};
async function loadAccounts() {
  const box = $('#accList'); if (!box) return;
  try {
    const { users } = await api('users');
    LIVE.users = users;
    box.innerHTML = `<div class="card list">${users.map(u => {
      const e = u.employeeId && db.employees.find(x => x.id === u.employeeId), mine = u.id === LIVE.user.id;
      const canEdit = !mine && (can('owner') || u.role === 'staff');
      return `<div class="li${u.active ? '' : ' faded'}"><div class="blk"><span class="me-av">${esc(u.name.trim().split(' ').pop()[0] || '?')}</span><div><b>${esc(u.name)}${mine ? ' (bạn)' : ''}</b><small>${esc(u.username)} · ${ROLE_L[u.role]}${e ? ' · ' + esc(e.name) + ' – ' + esc(group(e.groupId).name) : ''}</small></div></div>
        <div class="li-r row">${u.active ? chip('Đang dùng', 'green') : chip('Đã khoá', 'ghost')}
        ${canEdit ? `<button class="btn sm ghost" data-act="acc-pw" data-id="${u.id}">Đặt lại mật khẩu</button><button class="btn sm ghost ${u.active ? 't-red' : ''}" data-act="acc-toggle" data-id="${u.id}">${u.active ? 'Khoá' : 'Mở khoá'}</button>` : ''}</div></div>`;
    }).join('')}</div>`;
  } catch (err) { box.innerHTML = `<div class="alert red">${icon('alert')}<div><b>Không tải được danh sách tài khoản.</b><span>${esc(err.message)}</span></div></div>`; }
}

views.work = () => {
  const head = tabs('workTab', { viec: role() === 'staff' ? 'Việc của tôi' : 'Việc đã giao', chat: 'Nhóm chat' });
  if (ui.workTab === 'chat') {
    const chs = channels();
    const cur = chs.find(c => c.id === ui.channel);
    if (cur) { (db.seen[me()] ||= {})[cur.id] = nowStr() + '~'; save(); } // mark read when opened
    return `${head}<div class="chat ${cur ? 'has-cur' : ''}"><div class="card ch-list">${chs.map(c => { const last = db.messages.filter(m => m.ch === c.id).sort((a, b) => b.at.localeCompare(a.at))[0], u = unreadIn(c.id);
      return `<button class="ch-item ${c.id === ui.channel ? 'on' : ''}" data-act="channel" data-id="${c.id}" style="--c:${c.color}"><span class="ch-ic">${icon(c.id === 'all' ? 'home' : 'users')}</span><span class="ch-txt"><b>${esc(c.name)}</b><small>${last ? esc(last.taskId ? '📋 Việc được giao' : (last.from === me() ? 'Bạn: ' : who(last.from).split(' ').pop() + ': ') + (last.text || '📷 Ảnh')) : 'Chưa có tin nhắn'}</small></span>${u ? `<em class="badge">${u}</em>` : ''}</button>`; }).join('')}</div>
      <div class="card chat-pane">${cur ? chatThread(cur) : '<div class="empty">Chọn một kênh để nhắn tin.</div>'}</div></div>`;
  }
  if (role() === 'staff') {
    const mine = myTasks().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    const grp = (title, list) => (list.length ? section(title, `<div class="stack">${list.map(t => taskCard(t)).join('')}</div>`) : '');
    return `${head}<p class="hint">Có việc mới: bấm <b>Xác nhận nhận việc</b>. Làm xong (hoặc cuối ca): bấm <b>Đã xong</b>. Gặp lỗi: bấm <b>Báo lỗi</b>, chụp ảnh và ghi rõ lỗi để chủ xưởng kiểm tra.</p>
      ${grp('Việc mới – cần xác nhận', mine.filter(t => t.status === 'moi'))}${grp('Đang làm', mine.filter(t => t.status === 'nhan'))}${grp('Đã gửi', mine.filter(t => t.status === 'xong' || t.status === 'loi'))}
      ${mine.length ? '' : empty('Chưa có việc nào được giao cho bạn.')}`;
  }
  const F = { '': 'Tất cả', check: 'Cần kiểm tra', moi: 'Chờ nhận', nhan: 'Đang làm', done: 'Đã kiểm tra' };
  const match = t => !ui.taskFilter || (ui.taskFilter === 'check' ? WC.needsReview(t) : ui.taskFilter === 'done' ? !!t.review?.ok : t.status === ui.taskFilter);
  const rank = t => (t.status === 'loi' && !t.review ? 0 : WC.needsReview(t) ? 1 : t.status === 'moi' ? 2 : t.status === 'nhan' ? 3 : 4);
  const list = db.tasks.filter(match).sort((a, b) => rank(a) - rank(b) || b.createdAt.localeCompare(a.createdAt));
  const cnt = k => db.tasks.filter(t => (k === 'check' ? WC.needsReview(t) : k === 'done' ? !!t.review?.ok : k ? t.status === k : true)).length;
  return `${head}<p class="hint">Giao cho một người hoặc cả tổ – người nhận có thông báo và phải bấm xác nhận. Việc báo xong / báo lỗi nằm ở “Cần kiểm tra”.</p>
    <div class="chips">${Object.entries(F).map(([k, l]) => `<button class="fchip" aria-pressed="${ui.taskFilter === k}" data-act="tab" data-key="taskFilter" data-val="${k}">${l} · ${cnt(k)}</button>`).join('')}</div>
    <div class="stack">${list.map(t => taskCard(t)).join('') || empty('Không có việc ở mục này.')}</div>`;
};

function noteCard(n) {
  const refO = n.ref && orderByCode(n.ref);
  const st = n.type === 'proposal' ? { open: ['Chờ duyệt', 'amber'], approved: ['Đã duyệt', 'green'], rejected: ['Từ chối', 'red'] }[n.status] : n.status === 'open' ? ['Chưa xử lý', 'blue'] : ['Đã xử lý', 'green'];
  return `<article class="card pad notec${n.status === 'open' ? '' : ' faded'}"><div class="o-top"><b>${esc(n.by)}</b><span class="muted">${fdate(n.date)} ${esc(n.time)}</span>${chip(st[0], st[1])}${refO ? `<a class="chip ghost" href="#/don-hang" data-act="goto-order" data-id="${refO.id}">${esc(n.ref)}</a>` : n.ref ? chip(n.ref, 'ghost') : ''}</div>
    <p>${esc(n.text)}</p>
    ${n.status === 'open' ? `<div class="row-act">${n.type === 'note' ? `<button class="btn sm" data-act="note-resolve" data-id="${n.id}">${icon('check')}Đã xử lý</button>`
      : can('owner') ? `<button class="btn sm primary" data-act="note-approve" data-id="${n.id}">Duyệt</button><button class="btn sm ghost t-red" data-act="note-reject" data-id="${n.id}">Từ chối</button>` : '<span class="hint">Chờ chủ xưởng duyệt</span>'}</div>` : n.resolvedAt ? `<p class="hint">Xử lý ngày ${fdate(n.resolvedAt)}</p>` : ''}</article>`;
}

function billPay(b, o) {
  const total = b.snap.lines.reduce((s, l) => s + l.qty * l.price, 0), got = o ? WC.received(o) : 0;
  return got >= total ? { l: 'Đã thu đủ', c: 'green' } : got > 0 ? { l: 'Thu một phần', c: 'amber' } : { l: 'Chưa thu', c: 'red' };
}

function periodLabel(kind, iso, short) {
  const [y, m, d] = iso.split('-');
  if (kind === 'ngay') return short ? `${d}/${m}` : `${weekday(iso)}, ${d}/${m}/${y}`;
  if (kind === 'thang') return short ? `T${+m}` : `Tháng ${+m}/${y}`;
  return short ? y : `Năm ${y}`;
}

/* ---------- router ---------- */
const ALL = ['owner', 'nhaplieu', 'staff'];
const NAV = [
  { h: '', l: 'Tổng quan', s: 'Tổng quan', ic: 'home', r: ALL, d: 'Việc hôm nay, đơn trễ, cảnh báo' },
  { h: 'giao-viec', l: 'Giao việc & chat', s: 'Giao việc', ic: 'chat', r: ALL, d: 'Việc theo người/tổ, chat nhóm' },
  { h: 'don-hang', l: 'Đơn hàng & khách', s: 'Đơn hàng', ic: 'orders', r: ALL, d: 'Đơn, khách hàng, quy trình' },
  { h: 'kho', l: 'Kho', s: 'Kho', ic: 'box', r: ALL, d: 'Tồn kho, phiếu nhập, sổ kho' },
  { h: 'thu-chi', l: 'Thu chi', s: 'Thu chi', ic: 'money', r: ['owner'], d: 'Tiền vào/ra, giá thành, hoá đơn' },
  { h: 'diem-danh', l: 'Điểm danh', s: 'Điểm danh', ic: 'att', r: ['owner', 'nhaplieu'], d: 'Chấm công, bảng công tháng' },
  { h: 'bao-cao', l: 'Báo cáo ca', s: 'Báo cáo', ic: 'report', r: ALL, d: 'Sản lượng cuối ca, ảnh, ghi chú' },
  { h: 'ghi-chu', l: 'Ghi chú & đề xuất', s: 'Ghi chú', ic: 'note', r: ALL, d: 'Ghi chú chung, đề xuất thay đổi' },
  { h: 'tai-khoan', l: 'Tài khoản', s: 'Tài khoản', ic: 'key', r: ['owner', 'nhaplieu'], d: 'Tạo tài khoản, khoá, đặt lại mật khẩu' },
  { h: 'cai-dat', l: 'Cài đặt', s: 'Cài đặt', ic: 'gear', r: ['owner'], d: 'Xưởng, block, danh mục, nhân viên' },
];
const navFor = r => NAV.filter(n => n.r.includes(r));
const bottomFor = r => navFor(r).filter(n => ['', 'giao-viec', 'don-hang', 'kho'].includes(n.h)).slice(0, 4);
const ROUTES = { '': ['home', 'Tổng quan'], 'giao-viec': ['work', 'Giao việc'], 'don-hang': ['orders', 'Đơn hàng'], 'khach-hang': ['orders', 'Khách hàng'], kho: ['kho', 'Kho hàng'], 'thu-chi': ['thuchi', 'Thu chi'], 'diem-danh': ['att', 'Điểm danh'], 'bao-cao': ['reports', 'Báo cáo cuối ca'], 'ghi-chu': ['notes', 'Ghi chú & đề xuất'], 'cai-dat': ['settings', 'Cài đặt'], 'tai-khoan': ['accounts', 'Tài khoản'], them: ['more', 'Thêm'] };
const TOP_ACT = {
  orders: () => (can('manage') ? `<button class="btn primary" data-act="order-new">${icon('plus')}<span>Tạo đơn</span></button>` : ''),
  kho: () => `<button class="btn primary" data-act="receipt-new">${icon('inbox')}<span>Nhập hàng</span></button>`,
  reports: () => `<button class="btn primary" data-act="report-new">${icon('plus')}<span>Báo cáo ca</span></button>`,
  thuchi: () => `<button class="btn primary" data-act="expense-new">${icon('plus')}<span>Khoản chi</span></button>`,
  work: () => (can('manage') ? `<button class="btn primary" data-act="task-new">${icon('plus')}<span>Giao việc</span></button>` : ''),
  accounts: () => (LIVE.on ? `<button class="btn primary" data-act="acc-new">${icon('plus')}<span>Tạo tài khoản</span></button>` : ''),
};
let lastPath = null;
const roleSelect = () => (LIVE.on ? `<div class="me-box"><span class="me-av">${esc((LIVE.user.name || '?').trim().split(' ').pop()[0] || '?')}</span><div><b>${esc(LIVE.user.name)}</b><small>${ROLE_L[LIVE.user.role]} · ${esc(LIVE.user.username)}</small></div><button class="icon-btn sm" data-act="logout" aria-label="Đăng xuất" title="Đăng xuất">${icon('logout')}</button></div>` : demoRoleSelect());
const demoRoleSelect = () => `<label class="role-sel">Đang xem với vai trò<select data-change="role">
  <option value="owner" ${role() === 'owner' ? 'selected' : ''}>Chủ xưởng</option><option value="nhaplieu" ${role() === 'nhaplieu' ? 'selected' : ''}>Người nhập liệu</option>
  <optgroup label="Nhân viên">${byGroup(activeEmps()).map(e => `<option value="staff:${e.id}" ${role() === 'staff' && db.meta.meId === e.id ? 'selected' : ''}>${esc(e.name)} – ${esc(group(e.groupId).name)}</option>`).join('')}</optgroup></select></label>`;

function render() {
  const [path, query = ''] = location.hash.replace(/^#\/?/, '').split('?');
  const [base, param] = path.split('/');
  const p = new URLSearchParams(query);
  if (path !== lastPath) {
    ui.q = '';
    if (p.get('tab')) { ui.orderTab = p.get('tab'); ui.ordersSub = 'don'; }
    if (p.get('f')) { ui.khoTab = 'ton'; ui.khoFilter = p.get('f'); }
    if (base === 'khach-hang' && !param) ui.ordersSub = 'khach';
    if (base === 'giao-viec') ui.workTab = p.get('tab') === 'chat' ? 'chat' : ui.workTab;
  }
  const navBase = base === 'khach-hang' ? 'don-hang' : base;
  const allowed = base === 'them' || navFor(role()).some(n => n.h === navBase);
  const [name, title] = ROUTES[base] && allowed ? ROUTES[base] : ROUTES[''];
  const viewName = base === 'khach-hang' && param ? 'customer' : name;
  document.body.className = 'r-' + role();
  $('#view').innerHTML = (ROUTES[base] && !allowed ? `<div class="alert slate">${icon('alert')}<div><b>Vai trò ${ROLE_L[role()]} không xem được trang này.</b></div></div>` : '') + views[viewName](param);
  $('#title').textContent = viewName === 'customer' ? 'Khách hàng' : title;
  document.title = `${title} – Warecon`;
  $('#topAct').innerHTML = TOP_ACT[viewName]?.() || '';
  const wb = workBadge();
  const link = (n, short) => `<a href="#/${n.h}" class="${n.h === navBase ? 'on' : ''}" ${n.h === navBase ? 'aria-current="page"' : ''}>${icon(n.ic)}<span>${short ? n.s : n.l}</span>${n.h === 'giao-viec' && wb ? `<em class="badge">${wb}</em>` : ''}</a>`;
  const un = unreadNotifs().length;
  $('#bell').innerHTML = `${icon('bell')}${un ? `<em class="badge">${un}</em>` : ''}`;
  $('#bell').setAttribute('aria-label', un ? `Thông báo, ${un} chưa đọc` : 'Thông báo');
  $('#sideNav').innerHTML = navFor(role()).map(n => link(n)).join('');
  $('#bottomNav').innerHTML = bottomFor(role()).map(n => link(n, true)).join('') + `<a href="#/them" class="${base === 'them' || !bottomFor(role()).some(n => n.h === navBase) ? 'on' : ''}">${icon('more')}<span>Thêm</span></a>`;
  $('#sideRole').innerHTML = roleSelect();
  $$('[data-factory]').forEach(n => (n.textContent = db.meta.name));
  if (path !== lastPath) { scrollTo(0, 0); lastPath = path; }
  const cb = $('#chatBody'); if (cb) cb.scrollTop = cb.scrollHeight;
}
addEventListener('hashchange', render);

let toastT;
function toast(msg) { const t = $('#toast'); t.textContent = msg; t.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('on'), 3600); }
