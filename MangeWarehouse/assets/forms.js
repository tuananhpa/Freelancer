/* Warecon mockup – dialogs, forms, actions, Excel import/export and boot. */

/* ---------- dialog ---------- */
const dlg = $('#dlg');
function openSheet({ title, body, footer = '', form = false }) {
  const tag = form ? 'form' : 'div';
  dlg.innerHTML = `<${tag} class="sheet">
    <header class="sheet-h"><h2 id="dlgTitle">${esc(title)}</h2><button type="button" class="icon-btn" data-act="close" aria-label="Đóng">${icon('x')}</button></header>
    <div class="sheet-b">${body}</div>
    <p class="form-err" role="alert"></p>
    <footer class="sheet-f">${footer}</footer></${tag}>`;
  dlg.showModal();
  return $('.sheet', dlg);
}
function openForm({ title, body, submit = 'Lưu', onSubmit, onInput }) {
  const f = openSheet({ title, body, form: true, footer: `<button type="button" class="btn ghost" data-act="close">Huỷ</button><button class="btn primary">${submit}</button>` });
  f.addEventListener('input', () => ($('.form-err', f).textContent = ''));
  f.addEventListener('submit', async e => {
    e.preventDefault();
    const btn = $('.sheet-f .btn.primary', f);
    try {
      const r = onSubmit(f);
      if (r?.then) { btn.disabled = true; await r; } // server calls (accounts, passwords)
      dlg.close(); save(); render();
    } catch (err) { $('.form-err', f).textContent = err.message; }
    finally { btn.disabled = false; }
  });
  if (onInput) { f.addEventListener('input', () => onInput(f)); f.addEventListener('change', () => onInput(f)); onInput(f); }
  $('input:not([type=hidden]):not([type=checkbox]),select,textarea', f)?.focus();
  return f;
}
const val = (f, n) => f.elements[n]?.value.trim() ?? '';
// Reads repeated rows: inputs named l_xxx become {xxx}. Money inputs are parsed, numbers converted.
const readRows = (f, sel) => $$(sel, f).map(r => Object.fromEntries($$('[name]', r).map(i => [i.name.slice(2), i.dataset.money !== undefined ? parseMoney(i.value) : i.type === 'number' ? +i.value : i.value.trim()])));
const readSteps = f => (f.elements.useProcess?.checked ? $$('.step', f).map(r => ({ id: r.dataset.sid, blockId: r.dataset.block, name: r.dataset.name, color: r.dataset.color, days: Math.max(1, +$('[name=s_days]', r).value || 1) })) : []);
const rmBtn = `<button type="button" class="icon-btn l-rm" data-act="rm-row" aria-label="Xoá dòng">${icon('x')}</button>`;
const moneyInput = (name, v, label, ph = '0') => `<label>${label}<input name="${name}" inputmode="numeric" data-money value="${v ? num(v) : ''}" placeholder="${ph}"></label>`;

// Two-tap confirm for destructive buttons.
function armed(b, label, fn) {
  if (b.dataset.armed) return fn();
  const old = b.innerHTML; b.dataset.armed = 1; b.textContent = label;
  setTimeout(() => { delete b.dataset.armed; b.innerHTML = old; }, 3500);
}

/* ---------- order rules that touch stock ---------- */
function issueMaterials(o) {
  const short = WC.shortages(o, db.items);
  if (short.length) throw new Error('Thiếu vật tư: ' + short.map(s => `${s.item?.name} (cần ${num(s.need)}, còn ${num(s.have)})`).join('; '));
  for (const m of o.materials || []) {
    const it = item(m.itemId);
    it.stock = WC.moveStock(it.stock, 'xuat', m.qty);
    db.moves.push({ id: uid(), date: today(), itemId: it.id, type: 'xuat', qty: m.qty, price: it.lastPrice || 0, ref: o.code, note: 'Xuất vật tư cho đơn' });
  }
  o.materialsIssued = true;
}
function startOrder(o) { issueMaterials(o); o.status = 'dang'; }
const runPromote = () => WC.promote(db.orders, db.meta.capacity, o => !WC.shortages(o, db.items).length, issueMaterials);
function finishOrder(o) {
  o.status = 'xong'; o.doneAt = today();
  const moved = runPromote();
  toast(`${o.code} hoàn thành.${moved.length ? ` Đã đưa ${moved.map(x => x.code).join(', ')} lên “Đang làm” và xuất vật tư.` : ''}`);
}

/* ---------- order form ---------- */
const PRODUCT_NAMES = () => [...new Set([...db.items.filter(i => i.type === 'finished').map(i => i.name), ...db.orders.flatMap(o => o.lines.map(l => l.name))])];
const orderLine = (l = {}) => `<div class="line">
  <label class="l-name">Tên hàng<input name="l_name" list="dl-products" required maxlength="200" value="${esc(l.name)}" placeholder="VD: Bàn ăn gỗ sồi 1m6"></label>
  <label class="l-note">Quy cách / ghi chú<input name="l_note" maxlength="300" value="${esc(l.note)}" placeholder="Màu, kích thước…"></label>
  <label class="l-qty">SL<input name="l_qty" type="number" min="0.001" step="any" required value="${l.qty ?? 1}"></label>
  <label class="l-price">Đơn giá (₫)<input name="l_price" inputmode="numeric" data-money value="${l.price ? num(l.price) : ''}" placeholder="0"></label>
  ${rmBtn}</div>`;
const matLine = (m = {}) => `<div class="line mline">
  <label class="l-name">Vật tư<select name="l_itemId"><option value="">— Chọn —</option>${db.items.filter(i => i.type === 'material').map(i => `<option value="${i.id}" ${m.itemId === i.id ? 'selected' : ''}>${esc(i.name)} (tồn ${num(i.stock)} ${esc(i.unit)})</option>`).join('')}</select></label>
  <label class="l-qty">Số lượng<input name="l_qty" type="number" min="0.001" step="any" value="${m.qty ?? ''}"></label>
  <span class="l-info" data-avail></span>${rmBtn}</div>`;
const stepRow = s => `<div class="step" data-block="${s.blockId}" data-sid="${s.id || ''}" data-name="${esc(s.name)}" data-color="${s.color}" style="--c:${s.color}">
  <span class="dot"></span><b>${esc(s.name)}</b>
  ${s.status === 'xong' ? `<span class="chip green">Đã xong</span><input type="hidden" name="s_days" value="${s.days}">` : `
  <label class="s-days">Ngày<input name="s_days" type="number" min="1" max="60" value="${s.days}"></label>
  <span class="s-act"><button type="button" class="icon-btn sm" data-act="step-move" data-n="-1" aria-label="Lên">${icon('up')}</button><button type="button" class="icon-btn sm" data-act="step-move" data-n="1" aria-label="Xuống">${icon('chev')}</button><button type="button" class="icon-btn sm" data-act="step-rm" aria-label="Bỏ ${esc(s.name)}">${icon('x')}</button></span>`}</div>`;

function orderForm(o, preset = {}) {
  const editing = !!o;
  o = o || { customerId: preset.cust || '', priority: 'G3', start: today(), end: addDays(today(), 5), due: addDays(today(), 7), lines: [{}], deposit: 0, note: '', materials: [], process: null, payments: [], ...preset.copy };
  openForm({
    title: editing ? `Sửa đơn ${o.code}` : 'Tạo đơn hàng',
    submit: editing ? 'Lưu thay đổi' : 'Tạo đơn',
    body: `
      <div class="grid2">
        <label>Khách hàng<select name="customerId" required><option value="">— Chọn khách —</option><option value="__new">＋ Khách hàng mới…</option>${db.customers.map(c => `<option value="${c.id}" ${o.customerId === c.id ? 'selected' : ''}>${esc(c.name)}</option>`).join('')}</select></label>
        <label>Mức ưu tiên<select name="priority">${PRI.map(p => `<option value="${p}" ${o.priority === p ? 'selected' : ''}>${p} – ${PRI_L[p]}</option>`).join('')}</select></label>
      </div>
      <fieldset class="newcust" hidden><legend>Khách hàng mới</legend><div class="grid3">
        <label>Tên khách<input name="nc_name" maxlength="200"></label><label>Số điện thoại<input name="nc_phone" type="tel" maxlength="30"></label><label>Địa chỉ<input name="nc_address" maxlength="300"></label></div></fieldset>
      <div class="grid3">
        <label>Ngày bắt đầu<input type="date" name="start" required value="${o.start}"></label>
        <label>Kết thúc dự kiến<input type="date" name="end" required value="${o.end || o.due}"></label>
        <label>Khách muốn nhận<input type="date" name="due" required value="${o.due}"></label>
      </div>
      <p class="hint" data-cap></p>
      <fieldset><legend>Hàng trong đơn</legend><datalist id="dl-products">${PRODUCT_NAMES().map(n => `<option value="${esc(n)}">`).join('')}</datalist>
        <div class="lines" data-rows="order">${o.lines.map(orderLine).join('')}</div>
        <button type="button" class="btn sm" data-act="add-row" data-kind="order">${icon('plus')} Thêm dòng hàng</button></fieldset>
      <fieldset><legend>Vật tư cần cho đơn <span class="muted">(tuỳ chọn)</span></legend>
        ${o.materialsIssued ? '<p class="hint">Vật tư của đơn này đã xuất kho – sửa ở đây không xuất thêm. Cần thêm thì dùng Kho → “Xuất”.</p>' : '<p class="hint">Đủ vật tư thì đơn mới chuyển sang “Đang làm”, khi đó app tự xuất kho.</p>'}
        <div class="lines" data-rows="mat">${(o.materials || []).map(matLine).join('')}</div>
        <button type="button" class="btn sm" data-act="add-row" data-kind="mat">${icon('plus')} Thêm vật tư</button></fieldset>
      <fieldset class="proc-f"><legend>Quy trình sản xuất <span class="muted">(tuỳ chọn)</span></legend>
        <label class="switch"><input type="checkbox" name="useProcess" ${o.process ? 'checked' : ''}><span>Theo dõi từng công đoạn cho đơn này</span></label>
        <div class="proc-box">
          <div class="steps">${(o.process?.steps || []).map(stepRow).join('')}</div>
          <p class="hint" data-steps-empty>Bấm các block bên dưới theo đúng thứ tự làm.</p>
          <div class="palette">${db.blocks.map(b => `<button type="button" class="block-btn" style="--c:${b.color}" data-act="step-add" data-id="${b.id}">${icon('plus')}${esc(b.name)}</button>`).join('')}
            ${db.blocks.length ? '<button type="button" class="btn sm ghost" data-act="step-all">Thêm tất cả</button>' : ''}</div>
          <p class="hint" data-plan></p>
          <p class="hint">Thiếu công đoạn? Tạo block mới ở <a href="#/cai-dat" data-act="close-go">Cài đặt → Công đoạn mẫu</a>.</p>
        </div></fieldset>
      <fieldset><legend>Tiền</legend>
        <div class="grid2 end">${moneyInput('deposit', o.deposit, 'Tiền cọc yêu cầu (₫)')}
          <div class="total">Giá trị đơn<b data-total>0 ₫</b><small data-remain></small></div></div>
        ${editing ? '<p class="hint">Thu tiền (cọc, thanh toán) ghi ở mục “Tiền của đơn” – mỗi lần thu là một dòng có ngày.</p>' : `
        <label class="switch"><input type="checkbox" name="paidNow"><span>Đã nhận đủ tiền cọc lúc tạo đơn</span></label>
        <label data-paid-method hidden>Hình thức nhận cọc<select name="method"><option value="ck">Chuyển khoản</option><option value="tm">Tiền mặt</option></select></label>`}
      </fieldset>
      <label>Ghi chú (tuỳ chọn)<textarea name="note" rows="2" maxlength="2000">${esc(o.note)}</textarea></label>`,
    onInput(f) {
      $('.newcust', f).hidden = f.elements.customerId.value !== '__new';
      f.elements.nc_name.required = f.elements.customerId.value === '__new';
      const v = orderValue({ lines: readRows(f, '[data-rows=order] .line') }), dep = parseMoney(f.elements.deposit.value);
      $('[data-total]', f).textContent = money(v);
      $('[data-remain]', f).textContent = editing ? `Đã thu ${money(WC.received(o))} · còn ${money(v - WC.received(o))}` : dep ? `Cọc ${pct(v ? dep / v : 0)} giá trị đơn` : '';
      if (f.elements.paidNow) $('[data-paid-method]', f).hidden = !f.elements.paidNow.checked;
      for (const r of $$('.mline', f)) {
        const it = db.items.find(i => i.id === $('[name=l_itemId]', r).value), q = +$('[name=l_qty]', r).value;
        $('[data-avail]', r).innerHTML = !it || !q ? '' : o.materialsIssued ? '' : it.stock >= q ? '<b class="t-green">Đủ</b>' : `<b class="t-red">Thiếu ${num(q - it.stock)} ${esc(it.unit)}</b>`;
      }
      $('.proc-box', f).hidden = !f.elements.useProcess.checked;
      const steps = readSteps(f);
      $('[data-steps-empty]', f).hidden = steps.length > 0;
      const s = val(f, 'start');
      if (steps.length && s) {
        const end = WC.planSteps(s, steps).pop().to, over = daysBetween(val(f, 'due'), end);
        $('[data-plan]', f).innerHTML = `Tổng ${steps.reduce((a, x) => a + x.days, 0)} ngày làm · dự kiến xong <b>${fdate(end)}</b>${over > 0 ? ` – <b class="t-red">trễ ${over} ngày so với ngày khách muốn nhận</b>` : ''}`;
      } else $('[data-plan]', f).textContent = '';
      // Red flag when the chosen dates fall on days that are already at capacity.
      const e = steps.length && s ? WC.planSteps(s, steps).pop().to : val(f, 'end');
      if (s && e && e >= s) {
        const load = WC.loadByDay(db.orders.filter(x => x !== o), s, Math.min(120, daysBetween(s, e) + 1));
        const busy = Object.entries(load).filter(([, c]) => c.length + 1 > db.meta.capacity);
        $('[data-cap]', f).innerHTML = busy.length ? `<b class="t-red">⚠ Lịch kín:</b> ${busy.length} ngày trong khoảng này đã có ${db.meta.capacity} đơn trở lên (từ ${fdate(busy[0][0])}: ${esc(busy[0][1].join(', '))}). Đơn sẽ phải chờ hoặc cần dời ngày.` : '';
      }
    },
    onSubmit(f) {
      const lines = readRows(f, '[data-rows=order] .line').filter(l => l.name);
      if (!lines.length) throw new Error('Đơn cần ít nhất một dòng hàng.');
      if (lines.some(l => !(l.qty > 0))) throw new Error('Số lượng mỗi dòng phải lớn hơn 0.');
      if (val(f, 'end') < val(f, 'start') || val(f, 'due') < val(f, 'start')) throw new Error('Ngày kết thúc và ngày khách nhận phải sau ngày bắt đầu.');
      const value = orderValue({ lines }), deposit = parseMoney(f.elements.deposit.value);
      if (deposit > value) throw new Error('Tiền cọc lớn hơn giá trị đơn.');
      if (editing && value < WC.received(o)) throw new Error(`Giá trị đơn nhỏ hơn số tiền đã thu (${money(WC.received(o))}).`);
      const materials = readRows(f, '.mline').filter(m => m.itemId && m.qty > 0);
      let process = null;
      if (f.elements.useProcess.checked) {
        const old = Object.fromEntries((o.process?.steps || []).filter(s => s.id).map(s => [s.id, s]));
        const steps = readSteps(f).map(s => (old[s.id] ? { ...old[s.id], days: s.days } : { ...s, id: uid(), status: 'cho', doneAt: '' }));
        if (!steps.length) throw new Error('Chọn ít nhất một công đoạn, hoặc tắt “Quy trình sản xuất”.');
        const c = WC.currentStep({ steps });
        if (o.status === 'dang' && c >= 0 && !steps.some(s => s.status === 'dang')) steps[c].status = 'dang';
        process = { steps };
      }
      let customerId = val(f, 'customerId');
      if (customerId === '__new') {
        const c = { id: uid(), code: WC.nextCode('KH', db.customers), name: val(f, 'nc_name'), phone: val(f, 'nc_phone'), email: '', address: val(f, 'nc_address'), note: '', createdAt: today() };
        db.customers.push(c); customerId = c.id;
      }
      const data = { customerId, priority: val(f, 'priority'), start: val(f, 'start'), end: val(f, 'end'), due: val(f, 'due'), lines, deposit, materials, process, note: val(f, 'note') };
      if (editing) { Object.assign(o, data); toast(`Đã lưu đơn ${o.code}`); return; }
      const n = { id: uid(), code: WC.nextCode('DH-', db.orders), status: 'cho', createdAt: today(), doneAt: '', payments: [], costs: [], costFinal: false, materialsIssued: false, ...data };
      if (f.elements.paidNow.checked && deposit) n.payments.push({ id: uid(), date: today(), amount: deposit, kind: 'coc', method: val(f, 'method'), note: 'Cọc khi tạo đơn' });
      db.orders.push(n);
      const moved = runPromote();
      ui.ordersSub = 'don'; ui.orderTab = moved.includes(n) ? 'dang' : 'cho'; ui.open.add(n.id);
      const short = WC.shortages(n, db.items);
      toast(`Đã tạo đơn ${n.code}${moved.includes(n) ? ' – đưa thẳng vào “Đang làm”, đã xuất vật tư' : short.length ? ' – trong hàng chờ, đang thiếu vật tư' : ' – đang trong hàng chờ'}`);
      if (!location.hash.startsWith('#/don-hang') && !location.hash.startsWith('#/khach-hang/')) location.hash = '#/don-hang';
    },
  });
}

/* ---------- money forms ---------- */
function paymentForm(o) {
  const F = WC.finance(o, db.moves), depLeft = Math.max(0, F.deposit - F.received);
  openForm({
    title: `Thu tiền – ${o.code}`,
    submit: 'Ghi nhận',
    body: `<div class="stat4 mini"><div><span>Giá trị</span><b>${money(F.value)}</b></div><div><span>Cọc yêu cầu</span><b>${money(F.deposit)}</b></div><div><span>Đã thu</span><b class="t-green">${money(F.received)}</b></div><div><span>Còn lại</span><b class="t-red">${money(F.balance)}</b></div></div>
      <div class="grid2"><label>Ngày<input type="date" name="date" required value="${today()}" max="${today()}"></label>
        <label>Loại<select name="kind"><option value="coc" ${depLeft ? 'selected' : ''}>Đặt cọc</option><option value="tt" ${depLeft ? '' : 'selected'}>Thanh toán</option><option value="hoan">Hoàn tiền cho khách</option></select></label>
        ${moneyInput('amount', depLeft || F.balance, 'Số tiền (₫)')}
        <label>Hình thức<select name="method"><option value="ck">Chuyển khoản</option><option value="tm">Tiền mặt</option></select></label></div>
      <label>Ghi chú<input name="note" maxlength="200" placeholder="VD: Thanh toán đợt 2, số giao dịch…"></label>
      <p class="hint">Mỗi lần thu được lưu thành một dòng có ngày, không sửa/xoá. Ghi nhầm thì ghi một dòng “Hoàn tiền” để bù lại.</p>`,
    onSubmit(f) {
      const amount = parseMoney(f.elements.amount.value), kind = val(f, 'kind');
      if (!(amount > 0)) throw new Error('Nhập số tiền lớn hơn 0.');
      if (kind !== 'hoan' && amount > F.balance) throw new Error(`Vượt số còn phải thu (${money(F.balance)}).`);
      if (kind === 'hoan' && amount > F.received) throw new Error(`Hoàn nhiều hơn số đã thu (${money(F.received)}).`);
      o.payments.push({ id: uid(), date: val(f, 'date'), amount, kind, method: val(f, 'method'), note: val(f, 'note') });
      toast(`${o.code}: đã ghi ${PAY_L[kind].toLowerCase()} ${money(amount)}`);
    },
  });
}

const costLine = (c = {}) => `<div class="line cline"><label class="l-name">Khoản chi phí<input name="l_name" list="dl-costs" required maxlength="120" value="${esc(c.name)}" placeholder="Nhân công, vận chuyển…"></label>${moneyInput('l_amount', c.amount, 'Số tiền (₫)')}${rmBtn}</div>`;
function costForm(o) {
  const mat = WC.materialCost(o, db.moves);
  openForm({
    title: `Giá thành – ${o.code}`,
    body: `<div class="cost-row"><span>Vật tư đã xuất kho (tự tính từ sổ kho theo giá nhập)</span><b>${money(mat)}</b></div>
      <datalist id="dl-costs">${['Nhân công', 'Vận chuyển', 'Gia công ngoài', 'Điện máy', 'Khấu hao máy', 'Vật tư mua ngoài'].map(x => `<option value="${x}">`).join('')}</datalist>
      <fieldset><legend>Chi phí khác của đơn</legend><div class="lines" data-rows="cost">${(o.costs || []).map(costLine).join('')}</div>
        <button type="button" class="btn sm" data-act="add-row" data-kind="cost">${icon('plus')} Thêm khoản</button></fieldset>
      <div class="grid2 end"><label class="switch"><input type="checkbox" name="costFinal" ${o.costFinal ? 'checked' : ''}><span>Chốt giá thành (hết tạm tính)</span></label>
        <div class="total">Giá vốn / Lãi<b data-total></b><small data-remain></small></div></div>`,
    onInput(f) {
      const cost = mat + readRows(f, '.cline').reduce((s, c) => s + (c.amount || 0), 0), v = orderValue(o);
      $('[data-total]', f).textContent = money(cost);
      $('[data-remain]', f).textContent = `Lãi ${money(v - cost)} (${pct(v ? (v - cost) / v : 0)})`;
    },
    onSubmit(f) {
      o.costs = readRows(f, '.cline').filter(c => c.name);
      o.costFinal = f.elements.costFinal.checked;
      toast(`Đã lưu giá thành ${o.code}`);
    },
  });
}

function expenseForm() {
  openForm({
    title: 'Ghi khoản chi',
    body: `<div class="grid2"><label>Ngày<input type="date" name="date" required value="${today()}" max="${today()}"></label>
      <label>Loại chi<select name="category">${EXP_CATS.map(c => `<option>${c}</option>`).join('')}</select></label>
      ${moneyInput('amount', 0, 'Số tiền (₫)')}
      <label>Cho đơn hàng (tuỳ chọn)<select name="orderRef"><option value="">— Chi chung —</option>${db.orders.filter(o => o.status !== 'huy').map(o => `<option>${esc(o.code)}</option>`).join('')}</select></label></div>
      <label>Nội dung<input name="note" required maxlength="200" placeholder="VD: Lương tháng 11, tiền điện…"></label>
      <p class="hint">Mua vật tư không cần ghi ở đây – phiếu nhập kho đã tự tính vào tiền chi.</p>`,
    onSubmit(f) {
      const amount = parseMoney(f.elements.amount.value);
      if (!(amount > 0)) throw new Error('Nhập số tiền lớn hơn 0.');
      db.expenses.push({ id: uid(), date: val(f, 'date'), category: val(f, 'category'), amount, note: val(f, 'note'), orderRef: val(f, 'orderRef') });
      ui.tcTab = 'chi'; toast(`Đã ghi chi ${money(amount)}`);
      if (!location.hash.startsWith('#/thu-chi')) location.hash = '#/thu-chi';
    },
  });
}

function billSnap(o) { const c = cust(o.customerId); return { customer: { name: c.name, address: c.address || '', phone: c.phone || '' }, lines: o.lines.map(l => ({ ...l })), orderCode: o.code }; }
function billView(b) {
  const o = order(b.orderId), total = b.snap.lines.reduce((s, l) => s + l.qty * l.price, 0), got = o ? WC.received(o) : 0;
  openSheet({
    title: `Hoá đơn ${b.code}`,
    body: `<div class="print-area invoice">
      <div class="inv-h"><div><b class="inv-brand">${esc(db.meta.name)}</b><small>[[Địa chỉ, MST của xưởng – cần xác nhận]]</small></div>
        <div class="r"><b>HOÁ ĐƠN BÁN HÀNG</b><small>Số ${esc(b.code)} · ${fdate(b.date)}</small><small>Hạn thanh toán ${fdate(b.dueDate)}</small></div></div>
      <div class="inv-c"><small>Khách hàng</small><b>${esc(b.snap.customer.name)}</b><small>${esc(b.snap.customer.address)} ${esc(b.snap.customer.phone)}</small><small>Theo đơn ${esc(b.snap.orderCode)}</small></div>
      <div class="tbl"><table><thead><tr><th>#</th><th>Hàng hoá</th><th class="r">SL</th><th class="r">Đơn giá</th><th class="r">Thành tiền</th></tr></thead>
        <tbody>${b.snap.lines.map((l, i) => `<tr><td>${i + 1}</td><td class="wrap">${esc(l.name)}${l.note ? `<small class="muted"> · ${esc(l.note)}</small>` : ''}</td><td class="r">${num(l.qty)}</td><td class="r">${money(l.price)}</td><td class="r">${money(l.qty * l.price)}</td></tr>`).join('')}</tbody>
        <tfoot><tr><th colspan="4">Tổng cộng</th><th class="r">${money(total)}</th></tr><tr><td colspan="4">Đã thanh toán</td><td class="r">${money(got)}</td></tr><tr><th colspan="4">Còn phải trả</th><th class="r">${money(Math.max(0, total - got))}</th></tr></tfoot></table></div>
      <p class="hint">Mẫu hoá đơn nội bộ của bản mockup, không phải hoá đơn GTGT. Không hiện giá vốn, lãi.</p>
    </div>
    <p>${chip(BILL_L[b.status], { nhap: 'slate', phathanh: 'blue', huy: 'ghost' }[b.status])} ${b.status === 'phathanh' ? chip(billPay(b, o).l, billPay(b, o).c) : ''}</p>
    ${b.status === 'nhap' ? '<p class="hint">Bản nháp: sửa đơn rồi bấm “Cập nhật từ đơn”. Phát hành xong sẽ khoá nội dung.</p>' : ''}`,
    footer: `${b.status === 'nhap' ? `<button class="btn ghost" data-act="bill-refresh" data-id="${b.id}">Cập nhật từ đơn</button><button class="btn" data-act="bill-issue" data-id="${b.id}">Phát hành</button>` : ''}
      ${b.status === 'phathanh' ? `<button class="btn ghost t-red" data-act="bill-void" data-id="${b.id}">Huỷ hoá đơn</button>` : ''}
      <button class="btn primary" data-act="print">${icon('print')} In / lưu PDF</button>`,
  });
}

/* ---------- warehouse forms ---------- */
const receiptLine = (l = {}) => `<div class="line rline">
  <label class="l-name">Mặt hàng<select name="l_itemId" required><option value="">— Chọn —</option>${db.items.map(i => `<option value="${i.id}" ${l.itemId === i.id ? 'selected' : ''}>${esc(i.name)} (${esc(i.unit)})</option>`).join('')}</select></label>
  <label class="l-qty">SL<input name="l_qty" type="number" min="0.001" step="any" required value="${l.qty ?? ''}"></label>
  ${can('money') ? moneyInput('l_price', l.price, 'Đơn giá (₫)') : ''}${rmBtn}</div>`;
function receiptForm(preItem) {
  openForm({
    title: 'Nhập hàng (phiếu nhập kho)',
    submit: 'Ghi phiếu nhập',
    body: `
      <div class="grid2"><label>Ngày nhập<input type="date" name="date" required value="${today()}" max="${today()}"></label>
        <label>Nhà cung cấp<input name="supplier" required maxlength="200" list="dl-sup" placeholder="Tên nhà cung cấp"><datalist id="dl-sup">${[...new Set(db.receipts.map(r => r.supplier))].map(s => `<option value="${esc(s)}">`).join('')}</datalist></label></div>
      <fieldset><legend>Hàng nhập</legend><div class="lines" data-rows="receipt">${receiptLine(preItem ? { itemId: preItem, price: item(preItem).lastPrice } : {})}</div>
        <button type="button" class="btn sm" data-act="add-row" data-kind="receipt">${icon('plus')} Thêm dòng</button>
        <p class="hint">Chưa có mặt hàng trong danh sách? Tạo ở Kho → “+ Mặt hàng” trước.</p></fieldset>
      ${can('money') ? '<div class="total">Tổng tiền phiếu<b data-total>0 ₫</b></div>' : ''}
      <label>Ghi chú (tuỳ chọn)<textarea name="note" rows="2" maxlength="1000" placeholder="Số hoá đơn NCC, người giao…"></textarea></label>`,
    onInput(f) { const t = $('[data-total]', f); if (t) t.textContent = money(readRows(f, '.rline').reduce((s, l) => s + (l.qty || 0) * (l.price || 0), 0)); },
    onSubmit(f) {
      const lines = readRows(f, '.rline').map(l => ({ itemId: l.itemId, qty: l.qty, price: l.price || 0 }));
      if (lines.some(l => !l.itemId || !(l.qty > 0))) throw new Error('Mỗi dòng cần chọn mặt hàng và số lượng > 0.');
      const r = { id: uid(), code: WC.nextCode('PN-', db.receipts), date: val(f, 'date'), supplier: val(f, 'supplier'), note: val(f, 'note'), lines };
      for (const l of lines) {
        const it = item(l.itemId);
        it.stock = WC.moveStock(it.stock, 'nhap', l.qty);
        if (l.price) it.lastPrice = l.price;
        db.moves.push({ id: uid(), date: r.date, itemId: l.itemId, type: 'nhap', qty: l.qty, price: l.price, ref: r.code, note: r.supplier });
      }
      db.receipts.push(r);
      ui.khoTab = 'nhap';
      if (!location.hash.startsWith('#/kho')) location.hash = '#/kho';
      const moved = runPromote();
      toast(`Đã ghi ${r.code}, cộng ${lines.length} mặt hàng vào kho.${moved.length ? ` Đủ vật tư: ${moved.map(o => o.code).join(', ')} đã lên “Đang làm”.` : ''}`);
    },
  });
}

function moveForm(it) {
  openForm({
    title: `Xuất / điều chỉnh: ${it.name}`,
    submit: 'Ghi sổ kho',
    body: `<p class="hint">Tồn hiện tại: <b>${num(it.stock)} ${esc(it.unit)}</b></p>
      <div class="grid2"><label>Loại<select name="type"><option value="xuat">Xuất cho sản xuất / giao hàng</option><option value="dieuchinh">Điều chỉnh sau kiểm kê</option></select></label>
      <label data-for="xuat">Số lượng xuất<input name="qty" type="number" min="0.001" step="any"></label>
      <label data-for="dieuchinh" hidden>Số lượng thực tế đếm được<input name="actual" type="number" min="0" step="any" value="${it.stock}"></label></div>
      <label data-for="xuat">Cho đơn hàng (tuỳ chọn – tính vào giá vốn đơn)<select name="ref"><option value="">— Không gắn đơn —</option>${db.orders.filter(o => OPEN.includes(o.status)).sort(queueSort).map(o => `<option>${esc(o.code)}</option>`).join('')}</select></label>
      <label>Lý do<input name="note" required maxlength="300" placeholder="VD: Cắt ván cho DH-003, hàng hỏng, kiểm kê cuối tháng…"></label>`,
    onInput(f) { const t = val(f, 'type'); $$('[data-for]', f).forEach(el => (el.hidden = el.dataset.for !== t)); f.elements.qty.required = t === 'xuat'; },
    onSubmit(f) {
      const type = val(f, 'type');
      const qty = type === 'xuat' ? +val(f, 'qty') : Math.round((+val(f, 'actual') - it.stock) * 1000) / 1000;
      if (type === 'dieuchinh' && qty === 0) throw new Error('Số đếm được bằng tồn hiện tại – không cần điều chỉnh.');
      it.stock = WC.moveStock(it.stock, type, qty);
      db.moves.push({ id: uid(), date: today(), itemId: it.id, type, qty, price: it.lastPrice || 0, ref: type === 'xuat' ? val(f, 'ref') : '', note: val(f, 'note') });
      toast(`Đã ghi sổ kho. Tồn mới: ${num(it.stock)} ${it.unit}`);
    },
  });
}

function itemForm(it) {
  const editing = !!it; it = it || { sku: '', name: '', type: 'material', unit: '', threshold: 0, categoryId: '', attrs: {} };
  openForm({
    title: editing ? 'Sửa mặt hàng' : 'Thêm mặt hàng',
    body: `<div class="grid2"><label>Mã hàng (SKU)<input name="sku" required maxlength="60" value="${esc(it.sku)}" placeholder="VD: GO-SOI-18"></label>
      <label>Tên hàng<input name="name" required maxlength="120" value="${esc(it.name)}"></label>
      <label>Loại<select name="type" ${editing ? 'disabled' : ''}><option value="material" ${it.type === 'material' ? 'selected' : ''}>Nguyên vật liệu</option><option value="finished" ${it.type === 'finished' ? 'selected' : ''}>Thành phẩm</option></select></label>
      <label>Danh mục<select name="categoryId"><option value="">— Không —</option>${db.categories.map(k => `<option value="${k.id}" ${it.categoryId === k.id ? 'selected' : ''}>${esc(k.name)}</option>`).join('')}</select></label>
      <label>Đơn vị tính<input name="unit" required maxlength="20" value="${esc(it.unit)}" placeholder="tấm, m, kg, cái…" ${editing ? 'readonly' : ''}></label>
      <label>Ngưỡng cảnh báo sắp hết<input name="threshold" type="number" min="0" step="any" value="${it.threshold}"></label>
      ${editing ? '' : '<label>Tồn đầu kỳ<input name="opening" type="number" min="0" step="any" value="0"></label>'}</div>
      ${db.categories.map(k => `<div class="grid2" data-cat="${k.id}" hidden>${k.fields.map(fd => `<label>${esc(fd.label)}<input name="a__${k.id}__${fd.key}" maxlength="200" value="${esc(it.categoryId === k.id ? it.attrs?.[fd.key] : '')}"></label>`).join('')}</div>`).join('')}
      ${editing ? '<p class="hint">Loại và đơn vị tính không đổi được để giữ đúng lịch sử. Đổi số tồn: dùng “Xuất / điều chỉnh”.</p>' : ''}`,
    onInput(f) { $$('[data-cat]', f).forEach(el => (el.hidden = el.dataset.cat !== val(f, 'categoryId'))); },
    onSubmit(f) {
      const sku = val(f, 'sku'), cat = val(f, 'categoryId');
      if (db.items.some(x => x !== it && fold(x.sku) === fold(sku))) throw new Error('Mã hàng đã tồn tại.');
      const attrs = {};
      for (const fd of db.categories.find(k => k.id === cat)?.fields || []) { const v = val(f, `a__${cat}__${fd.key}`); if (v) attrs[fd.key] = v; }
      const data = { sku, name: val(f, 'name'), unit: val(f, 'unit'), threshold: +val(f, 'threshold') || 0, categoryId: cat, attrs };
      if (editing) Object.assign(it, data);
      else {
        const n = { id: uid(), type: val(f, 'type'), stock: +val(f, 'opening') || 0, lastPrice: 0, ...data };
        db.items.push(n);
        if (n.stock) db.moves.push({ id: uid(), date: today(), itemId: n.id, type: 'nhap', qty: n.stock, price: 0, ref: '', note: 'Tồn đầu kỳ' });
      }
      toast('Đã lưu mặt hàng');
    },
  });
}

function categoryForm(k) {
  const editing = !!k; k = k || { name: '', fields: [] };
  openForm({
    title: editing ? 'Sửa danh mục' : 'Thêm danh mục',
    body: `<label>Tên danh mục<input name="name" required maxlength="80" value="${esc(k.name)}" placeholder="VD: Gỗ, Vải, Bàn ghế…"></label>
      <label>Các trường riêng (mỗi dòng một trường)<textarea name="fields" rows="4" placeholder="Loại gỗ&#10;Độ dày (mm)">${esc(k.fields.map(f => f.label).join('\n'))}</textarea></label>
      <p class="hint">Đổi tên trường không làm mất giá trị đã nhập của các mặt hàng cũ.</p>`,
    onSubmit(f) {
      const name = val(f, 'name');
      if (db.categories.some(x => x !== k && fold(x.name) === fold(name))) throw new Error('Danh mục đã tồn tại.');
      const labels = val(f, 'fields').split('\n').map(s => s.trim()).filter(Boolean);
      const fields = labels.map((label, i) => ({ key: k.fields[i]?.key || fold(label).replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '') || `f${i}`, label }));
      if (editing) Object.assign(k, { name, fields }); else db.categories.push({ id: uid(), name, fields });
      toast('Đã lưu danh mục');
    },
  });
}

/* ---------- people forms ---------- */
function custForm(c) {
  const editing = !!c; c = c || {};
  openForm({
    title: editing ? 'Sửa khách hàng' : 'Thêm khách hàng',
    body: `<div class="grid2"><label>Tên khách / công ty<input name="name" required maxlength="200" value="${esc(c.name)}"></label>
      <label>Số điện thoại<input name="phone" type="tel" maxlength="30" value="${esc(c.phone)}"></label>
      <label>Email<input name="email" type="email" maxlength="200" value="${esc(c.email)}"></label>
      <label>Địa chỉ<input name="address" maxlength="300" value="${esc(c.address)}"></label></div>
      <label>Ghi chú<textarea name="note" rows="2" maxlength="2000">${esc(c.note)}</textarea></label>`,
    onSubmit(f) {
      const data = { name: val(f, 'name'), phone: val(f, 'phone'), email: val(f, 'email'), address: val(f, 'address'), note: val(f, 'note') };
      const digits = data.phone.replace(/\D/g, '');
      const dup = db.customers.find(x => x !== c && ((digits && x.phone?.replace(/\D/g, '') === digits) || fold(x.name) === fold(data.name)));
      if (dup && !f.dataset.dupOk) { f.dataset.dupOk = 1; throw new Error(`Có thể trùng với “${dup.name}” (${dup.phone}). Bấm Lưu lần nữa nếu vẫn muốn lưu.`); }
      if (editing) Object.assign(c, data);
      else db.customers.push({ id: uid(), code: WC.nextCode('KH', db.customers), createdAt: today(), ...data });
      toast('Đã lưu khách hàng');
    },
  });
}

function empForm(e) {
  const editing = !!e; e = e || { active: true };
  openForm({
    title: editing ? 'Sửa nhân viên' : 'Thêm nhân viên',
    body: `<div class="grid2"><label>Họ và tên<input name="name" required maxlength="120" value="${esc(e.name)}"></label>
      <label>Tổ<select name="groupId"><option value="">— Chưa xếp tổ —</option>${db.groups.map(g => `<option value="${g.id}" ${e.groupId === g.id ? 'selected' : ''}>${esc(g.name)}</option>`).join('')}</select></label>
      <label>Công việc<input name="role" maxlength="80" value="${esc(e.role)}"></label>
      <label>Số điện thoại<input name="phone" type="tel" maxlength="30" value="${esc(e.phone)}"></label>
      <label>Tình trạng<select name="active"><option value="1">Đang làm</option><option value="0" ${e.active ? '' : 'selected'}>Đã nghỉ (ẩn khỏi điểm danh)</option></select></label></div>`,
    onSubmit(f) {
      const data = { name: val(f, 'name'), groupId: val(f, 'groupId'), role: val(f, 'role'), phone: val(f, 'phone'), active: val(f, 'active') === '1' };
      if (editing) Object.assign(e, data);
      else db.employees.push({ id: uid(), code: WC.nextCode('NV', db.employees, 2), ...data });
      toast('Đã lưu nhân viên');
    },
  });
}

const BLOCK_COLORS = ['#2563eb', '#0891b2', '#059669', '#65a30d', '#d97706', '#dc2626', '#db2777', '#7c3aed', '#475569'];
function blockForm(b) {
  const editing = !!b; b = b || { name: '', days: 1, color: BLOCK_COLORS[db.blocks.length % BLOCK_COLORS.length], note: '' };
  openForm({
    title: editing ? 'Sửa block công đoạn' : 'Thêm block công đoạn',
    body: `<div class="grid2"><label>Tên công đoạn<input name="name" required maxlength="80" value="${esc(b.name)}" placeholder="VD: Cắt phôi, Sơn lót…"></label>
      <label>Số ngày dự kiến<input name="days" type="number" min="1" max="60" required value="${b.days}"></label></div>
      <fieldset class="swatches"><legend>Màu nhận diện</legend>${BLOCK_COLORS.map(c => `<label class="sw" style="--c:${c}"><input type="radio" name="color" value="${c}" ${c === b.color ? 'checked' : ''}><span class="sr">Màu ${c}</span></label>`).join('')}</fieldset>
      <label>Mô tả / lưu ý (tuỳ chọn)<input name="note" maxlength="200" value="${esc(b.note)}"></label>
      ${editing ? '<p class="hint">Sửa block không làm đổi các đơn đã gắn công đoạn này.</p>' : ''}`,
    onSubmit(f) {
      const data = { name: val(f, 'name'), days: Math.max(1, +val(f, 'days') || 1), color: f.elements.color.value || BLOCK_COLORS[0], note: val(f, 'note') };
      if (editing) Object.assign(b, data); else db.blocks.push({ id: uid(), ...data });
      toast('Đã lưu block');
    },
  });
}

/* ---------- assigned work, groups, chat, notifications ---------- */
// In-app notification for each recipient except the person acting. Real push to other phones needs a server (Web Push).
function notify(to, text, link = '#/giao-viec') {
  const list = [...new Set([].concat(to))].filter(x => x && x !== me());
  for (const t of list) db.notifs.push({ id: uid(), to: t, at: nowStr(), text, link, read: false });
  return list.length;
}
function sysNotify() {
  const un = unreadNotifs();
  if (!un.length || !('Notification' in window) || Notification.permission !== 'granted') return;
  const opts = { body: un[un.length - 1].text, icon: 'icons/icon-192.png', badge: 'icons/icon-192.png', tag: 'warecon-' + me() };
  const title = `Warecon · ${un.length} thông báo mới cho ${meName()}`;
  (navigator.serviceWorker?.controller ? navigator.serviceWorker.ready.then(r => r.showNotification(title, opts)) : Promise.reject()).catch(() => { try { new Notification(title, opts); } catch {} });
}
const taskWho = t => (t.empId ? emp(t.empId).name : 'cả ' + group(t.groupId).name);

function taskForm(preset = {}) {
  const gid = preset.group || db.groups[0]?.id || '';
  openForm({
    title: 'Giao việc',
    submit: 'Giao việc & gửi thông báo',
    body: `<label>Việc cần làm<textarea name="text" required rows="2" maxlength="300" placeholder="VD: Lắp khung 6 bàn ăn gỗ sồi, xong trước 16h"></textarea></label>
      <div class="grid2"><label>Tổ<select name="groupId" required>${db.groups.map(g => `<option value="${g.id}" ${g.id === gid ? 'selected' : ''}>${esc(g.name)}</option>`).join('')}</select></label>
        <label>Giao cho<select name="empId"></select></label>
        <label>Ngày<input type="date" name="date" required value="${today()}" min="${today()}"></label>
        <label>Thuộc đơn hàng (tuỳ chọn)<select name="orderId"><option value="">— Không gắn đơn —</option>${db.orders.filter(o => OPEN.includes(o.status)).sort(queueSort).map(o => `<option value="${o.id}" ${o.id === preset.order ? 'selected' : ''}>${esc(o.code)} · ${esc(cust(o.customerId).name)}</option>`).join('')}</select></label></div>
      <p class="hint" data-who></p>`,
    onInput(f) {
      const g = val(f, 'groupId'), sel = f.elements.empId, keep = sel.value;
      if (sel.dataset.g !== g) {
        sel.innerHTML = `<option value="">Cả tổ (ai trong tổ cũng nhận được)</option>${members(g).map(e => `<option value="${e.id}">${esc(e.name)} – ${esc(e.role)}</option>`).join('')}`;
        sel.dataset.g = g; sel.value = members(g).some(e => e.id === keep) ? keep : '';
      }
      const n = sel.value ? 1 : members(g).length;
      $('[data-who]', f).textContent = `Sẽ gửi thông báo tới ${n} người. Người nhận phải bấm “Xác nhận nhận việc”. Việc cũng hiện trong kênh chat của tổ.`;
    },
    onSubmit(f) {
      const g = val(f, 'groupId');
      if (!members(g).length) throw new Error('Tổ này chưa có ai – thêm nhân viên vào tổ trước.');
      const t = { id: uid(), code: WC.nextCode('CV-', db.tasks), date: val(f, 'date'), orderId: val(f, 'orderId'), text: val(f, 'text'), groupId: g, empId: val(f, 'empId'),
        status: 'moi', by: meName(), createdAt: nowStr(), acceptedAt: '', acceptedBy: '', doneAt: '', issue: null, review: null };
      db.tasks.push(t);
      db.messages.push({ id: uid(), ch: g, from: me(), at: t.createdAt, text: '', photo: '', taskId: t.id });
      const n = notify(WC.taskTargets(t, db.employees), `Việc mới cho ${t.empId ? 'bạn' : group(g).name}: ${t.text}`);
      toast(`Đã giao ${t.code} cho ${taskWho(t)} – gửi thông báo tới ${n} người`);
    },
  });
}

function issueForm(t) {
  const photos = [];
  const f = openForm({
    title: `Báo lỗi – ${t.code}`,
    submit: 'Gửi cho chủ xưởng',
    body: `<p class="hint">${esc(t.text)}</p>
      <label>Lỗi gì?<textarea name="text" required rows="3" maxlength="1000" placeholder="VD: Vải lệch màu 2 cây, thiếu ốc, máy cưa kẹt…"></textarea></label>
      <div><b class="lbl">Ảnh chụp lỗi (tối đa 4)</b><div class="photos" data-photos></div>
        <label class="btn">${icon('report')} Chụp / chọn ảnh<input type="file" accept="image/*" capture="environment" multiple hidden data-photo-input></label></div>`,
    onSubmit(f) {
      Object.assign(t, { status: 'loi', doneAt: nowStr(), issue: { text: val(f, 'text'), photos: [...photos], at: nowStr() }, review: null });
      notify('owner', `${meName()} báo lỗi: ${t.text}`);
      toast('Đã gửi báo lỗi cho chủ xưởng');
    },
  });
  photoPicker(f, photos);
}

function redoForm(t) {
  openForm({
    title: `Yêu cầu làm lại – ${t.code}`,
    submit: 'Gửi lại cho người làm',
    body: `<p class="hint">${esc(t.text)}${t.issue ? ` · Lỗi: ${esc(t.issue.text)}` : ''}</p><label>Cần làm lại / sửa gì?<textarea name="note" required rows="3" maxlength="500"></textarea></label>`,
    onSubmit(f) {
      Object.assign(t, { status: 'nhan', doneAt: '', review: { ok: false, note: val(f, 'note'), at: nowStr() } });
      notify(t.acceptedBy || WC.taskTargets(t, db.employees), `Chủ xưởng yêu cầu làm lại ${t.code}: ${val(f, 'note')}`);
      toast(`Đã gửi yêu cầu làm lại cho ${taskWho(t)}`);
    },
  });
}

const GROUP_COLORS = ['#0891b2', '#7c3aed', '#d97706', '#475569', '#059669', '#db2777', '#1e4a8c', '#dc2626'];
function groupForm(g) {
  const editing = !!g; g = g || { name: '', color: GROUP_COLORS[db.groups.length % GROUP_COLORS.length] };
  openForm({
    title: editing ? 'Sửa tổ' : 'Thêm tổ',
    body: `<label>Tên tổ<input name="name" required maxlength="60" value="${esc(g.name)}" placeholder="VD: Tổ sơn, Ca đêm…"></label>
      <fieldset class="swatches"><legend>Màu tổ</legend>${GROUP_COLORS.map(c => `<label class="sw" style="--c:${c}"><input type="radio" name="color" value="${c}" ${c === g.color ? 'checked' : ''}><span class="sr">Màu ${c}</span></label>`).join('')}</fieldset>
      ${editing ? `<p class="hint">Thành viên: ${members(g.id).map(e => esc(e.name)).join(', ') || 'chưa có'}. Đổi tổ của từng người ở mục Sửa nhân viên.</p>` : ''}`,
    onSubmit(f) {
      const name = val(f, 'name');
      if (db.groups.some(x => x !== g && fold(x.name) === fold(name))) throw new Error('Đã có tổ tên này.');
      if (editing) Object.assign(g, { name, color: f.elements.color.value }); else db.groups.push({ id: uid(), name, color: f.elements.color.value });
      toast('Đã lưu tổ');
    },
  });
}

function sendMessage(ch, text, photo) {
  db.messages.push({ id: uid(), ch, from: me(), at: nowStr(), text, photo, taskId: '' });
  const to = ['owner', ...(ch === 'all' ? activeEmps() : members(ch)).map(e => e.id)];
  notify(to, `${meName()} nhắn ${ch === 'all' ? 'Toàn xưởng' : group(ch).name}: ${text || '📷 Ảnh'}`.slice(0, 140), `#/giao-viec?tab=chat&ch=${ch}`);
  save(); render(); $('.composer input[name=text]')?.focus();
}

function notifSheet() {
  const list = db.notifs.filter(n => n.to === me()).sort((a, b) => b.at.localeCompare(a.at)).slice(0, 40);
  openSheet({
    title: `Thông báo · ${meName()}`,
    body: list.length ? `<div class="card list">${list.map(n => `<a class="li notif ${n.read ? '' : 'unread'}" href="${esc(n.link)}" data-act="notif-go" data-id="${n.id}"><div><b>${esc(n.text)}</b><small>${n.at.slice(0, 10) === today() ? 'Hôm nay' : fdate(n.at.slice(0, 10))} ${esc(n.at.slice(11))}</small></div>${n.read ? '' : '<span class="dot" style="--c:var(--accent)"></span>'}</a>`).join('')}</div>` : empty('Chưa có thông báo.'),
    footer: list.some(n => !n.read) ? '<button class="btn" data-act="notif-readall">Đánh dấu đã đọc hết</button>' : '',
  });
}

/* ---------- reports, notes ---------- */
function compressImage(file, max = 1024) {
  return new Promise((res, rej) => {
    const img = new Image(), url = URL.createObjectURL(file);
    img.onload = () => {
      const k = Math.min(1, max / Math.max(img.width, img.height)), c = document.createElement('canvas');
      c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url); res(c.toDataURL('image/jpeg', 0.62));
    };
    img.onerror = () => { URL.revokeObjectURL(url); rej(new Error('Không đọc được ảnh')); };
    img.src = url;
  });
}

function reportForm(r) {
  const editing = !!r;
  const live = db.orders.filter(o => o.status === 'dang').sort(queueSort);
  const ids = [...new Set([...live.map(o => o.id), ...(r?.lines.map(l => l.orderId) || [])])];
  const photos = [...(r?.photos || [])];
  const f = openForm({
    title: editing ? `Sửa báo cáo ${fdate(r.date)}` : 'Báo cáo cuối ca',
    submit: editing ? 'Lưu bản sửa' : 'Gửi báo cáo',
    body: `<div class="grid2"><label>Ngày<input type="date" name="date" required value="${r?.date || today()}" max="${today()}"></label>
      <label>Người báo cáo<select name="by">${activeEmps().map(e => `<option ${(r?.by || 'Huỳnh Thị Thu') === e.name ? 'selected' : ''}>${esc(e.name)}</option>`).join('')}</select></label></div>
      <fieldset><legend>Sản lượng theo đơn</legend><p class="hint">Để trống đơn không làm trong ca.</p>
        <div class="rep-rows">${ids.map(id => { const o = order(id), l = r?.lines.find(x => x.orderId === id), c = WC.currentStep(o.process);
          return `<div class="line repline" data-order="${id}"><b class="l-name">${esc(o.code)} <small class="muted">${esc(cust(o.customerId).name)}</small></b>
            <label class="l-note">Công đoạn<input name="l_step" maxlength="80" value="${esc(l?.step ?? (c >= 0 ? o.process.steps[c].name : ''))}"></label>
            <label class="l-qty">Làm xong<input name="l_done" type="number" min="0" step="any" value="${l?.done ?? ''}"></label>
            <label class="l-price">Hàng lỗi<input name="l_defects" type="number" min="0" step="any" value="${l?.defects ?? ''}"></label></div>`; }).join('') || '<p class="hint">Không có đơn đang làm.</p>'}</div></fieldset>
      <label>Ghi chú<textarea name="note" rows="3" maxlength="2000" placeholder="Sự cố, thiếu vật tư, máy hỏng…">${esc(r?.note)}</textarea></label>
      <div><b class="lbl">Ảnh chụp (tối đa 4)</b><div class="photos" data-photos></div>
        <label class="btn sm">${icon('report')} Chụp / chọn ảnh<input type="file" accept="image/*" capture="environment" multiple hidden data-photo-input></label></div>
      ${editing ? '<label>Lý do sửa<input name="reason" required maxlength="200" placeholder="VD: Nhập nhầm số lượng"></label>' : ''}`,
    onSubmit(f) {
      const lines = $$('.repline', f).map(row => ({ orderId: row.dataset.order, step: $('[name=l_step]', row).value.trim(), done: +$('[name=l_done]', row).value || 0, defects: +$('[name=l_defects]', row).value || 0 })).filter(l => l.done || l.defects);
      if (!lines.length && !val(f, 'note')) throw new Error('Nhập sản lượng ít nhất một đơn hoặc ghi chú.');
      const data = { date: val(f, 'date'), by: val(f, 'by'), lines, note: val(f, 'note'), photos: [...photos] };
      if (editing) { r.history.push({ at: `${today()} ${new Date().toTimeString().slice(0, 5)}`, reason: val(f, 'reason'), prev: { date: r.date, by: r.by, lines: r.lines, note: r.note } }); Object.assign(r, data); }
      else db.reports.push({ id: uid(), history: [], createdAt: `${today()} ${new Date().toTimeString().slice(0, 5)}`, ...data });
      toast(editing ? 'Đã lưu bản sửa, bản cũ vẫn trong lịch sử' : 'Đã gửi báo cáo cuối ca');
      if (!location.hash.startsWith('#/bao-cao')) location.hash = '#/bao-cao';
    },
  });
  photoPicker(f, photos);
}

// Wires a [data-photos] preview + [data-photo-input] file input inside a form to the given array (max 4, compressed).
function photoPicker(f, photos) {
  const draw = () => { $('[data-photos]', f).innerHTML = photos.map((p, k) => `<span class="ph"><img src="${p}" alt="Ảnh ${k + 1}"><button type="button" class="ph-x" data-k="${k}" aria-label="Bỏ ảnh ${k + 1}">${icon('x')}</button></span>`).join(''); };
  draw();
  $('[data-photos]', f).addEventListener('click', e => { const b = e.target.closest('.ph-x'); if (b) { photos.splice(+b.dataset.k, 1); draw(); } });
  $('[data-photo-input]', f).addEventListener('change', async e => {
    for (const file of [...e.target.files].slice(0, 4 - photos.length)) { try { photos.push(await storePhoto(await compressImage(file))); } catch (err) { toast(err.message); } }
    e.target.value = ''; draw();
  });
}

// On the server the photo is uploaded once and referenced by URL; offline or in the demo it stays inline.
async function storePhoto(dataUrl) {
  if (!LIVE.on || LIVE.offline) return dataUrl;
  try { return (await api('photo', await (await fetch(dataUrl)).blob(), { type: 'image/jpeg' })).url; }
  catch { return dataUrl; }
}

/* ---------- accounts (server mode) ---------- */
function accountForm() {
  const roles = can('owner') ? { staff: 'Nhân viên', nhaplieu: 'Người nhập liệu', owner: 'Chủ xưởng' } : { staff: 'Nhân viên' };
  const linked = new Set((LIVE.users || []).map(u => u.employeeId).filter(Boolean));
  const free = byGroup(activeEmps()).filter(e => !linked.has(e.id));
  openForm({
    title: 'Tạo tài khoản',
    submit: 'Tạo tài khoản',
    body: `<div class="grid2"><label>Vai trò<select name="role">${Object.entries(roles).map(([k, l]) => `<option value="${k}">${l}</option>`).join('')}</select></label>
      <label data-emp>Là nhân viên<select name="employeeId">${free.map(e => `<option value="${e.id}">${esc(e.name)} – ${esc(group(e.groupId).name)}</option>`).join('') || '<option value="">— Mọi nhân viên đã có tài khoản —</option>'}</select></label>
      <label>Tên hiển thị<input name="name" required maxlength="80"></label>
      <label>Tên đăng nhập<input name="username" required pattern="[A-Za-z0-9._\\-]{3,32}" autocomplete="off" autocapitalize="none" spellcheck="false" placeholder="vd: tam.lr"></label>
      <label>Mật khẩu ban đầu<input name="password" type="password" required minlength="8" autocomplete="new-password"></label></div>
      <p class="hint">Gửi tên đăng nhập và mật khẩu cho người dùng. Họ nên đổi mật khẩu sau lần đăng nhập đầu (Thêm → Đổi mật khẩu).${free.length ? '' : ' Thêm nhân viên ở Cài đặt → Nhân viên & tổ trước khi tạo tài khoản nhân viên.'}</p>`,
    onInput(f) {
      const staff = val(f, 'role') === 'staff';
      $('[data-emp]', f).hidden = !staff;
      f.elements.employeeId.required = staff;
      const e = staff && db.employees.find(x => x.id === val(f, 'employeeId'));
      if (e && (!f.elements.name.value || f.elements.name.dataset.auto)) { f.elements.name.value = e.name; f.elements.name.dataset.auto = 1; }
    },
    async onSubmit(f) {
      const role = val(f, 'role');
      await api('users', { role, name: val(f, 'name'), username: val(f, 'username'), password: f.elements.password.value, employeeId: role === 'staff' ? val(f, 'employeeId') : '' });
      toast(`Đã tạo tài khoản ${val(f, 'username').toLowerCase()}`);
    },
  });
}

function accPwForm(u) {
  openForm({
    title: `Đặt lại mật khẩu – ${u.name}`,
    submit: 'Đặt lại',
    body: `<label>Mật khẩu mới<input name="password" type="password" required minlength="8" autocomplete="new-password"></label><p class="hint">${esc(u.name)} sẽ bị đăng xuất trên mọi máy và đăng nhập lại bằng mật khẩu này.</p>`,
    async onSubmit(f) { await api(`users/${u.id}`, { password: f.elements.password.value }); toast('Đã đặt lại mật khẩu'); },
  });
}

function pwChangeForm() {
  openForm({
    title: 'Đổi mật khẩu',
    submit: 'Đổi mật khẩu',
    body: `<input type="text" name="username" value="${esc(LIVE.user.username)}" autocomplete="username" hidden>
      <label>Mật khẩu hiện tại<input name="old" type="password" required autocomplete="current-password"></label>
      <label>Mật khẩu mới<input name="new" type="password" required minlength="8" autocomplete="new-password"></label>
      <label>Nhập lại mật khẩu mới<input name="new2" type="password" required minlength="8" autocomplete="new-password"></label>`,
    async onSubmit(f) {
      if (f.elements.new.value !== f.elements.new2.value) throw new Error('Hai mật khẩu mới không khớp.');
      await api('password', { old: f.elements.old.value, new: f.elements.new.value });
      toast('Đã đổi mật khẩu');
    },
  });
}

function noteForm(type) {
  if (type === 'proposal' && !(WC.proposalOpen(new Date(), db.meta.shiftStart) || db.meta.ignoreLock)) return toast('Đã quá 30 phút đầu ca – đề xuất bị khoá.');
  openForm({
    title: type === 'proposal' ? 'Gửi đề xuất thay đổi' : 'Thêm ghi chú',
    body: `<label>${type === 'proposal' ? 'Đề xuất' : 'Nội dung'}<textarea name="text" rows="3" required maxlength="1000"></textarea></label>
      <div class="grid2"><label>Gắn với<select name="ref"><option value="">— Chung cả xưởng —</option>${db.orders.filter(o => o.status !== 'huy').sort(queueSort).map(o => `<option>${esc(o.code)}</option>`).join('')}${db.items.map(i => `<option value="${esc(i.sku)}">Kho: ${esc(i.name)}</option>`).join('')}${db.customers.map(c => `<option value="${esc(c.name)}">Khách: ${esc(c.name)}</option>`).join('')}</select></label>
      <label>Người viết<select name="by"><option>${ROLE_L[role()] === 'Nhân viên' ? '' : ROLE_L[role()]}</option>${activeEmps().map(e => `<option>${esc(e.name)}</option>`).join('')}</select></label></div>`,
    onSubmit(f) {
      if (type === 'proposal' && !(WC.proposalOpen(new Date(), db.meta.shiftStart) || db.meta.ignoreLock)) throw new Error('Đã quá giờ nhận đề xuất.');
      db.notes.push({ id: uid(), type, date: today(), time: new Date().toTimeString().slice(0, 5), by: val(f, 'by') || 'Nhân viên', text: val(f, 'text'), ref: val(f, 'ref'), status: 'open', resolvedAt: '' });
      ui.noteTab = type; toast(type === 'proposal' ? 'Đã gửi đề xuất, chờ chủ xưởng duyệt' : 'Đã thêm ghi chú');
      if (!location.hash.startsWith('#/ghi-chu')) location.hash = '#/ghi-chu';
    },
  });
}

/* ---------- Excel ---------- */
let xlsxP;
const loadXLSX = () => (xlsxP ||= new Promise((res, rej) => {
  const s = document.createElement('script');
  s.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
  s.onload = () => res(window.XLSX); s.onerror = () => { xlsxP = null; rej(new Error('offline')); };
  document.head.appendChild(s);
}));
function download(name, blob) { const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000); }
const toCSV = rows => '﻿' + rows.map(r => r.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\r\n');
async function exportSheet(name, rows) {
  try {
    const X = await loadXLSX(), ws = X.utils.aoa_to_sheet(rows), wb = X.utils.book_new();
    ws['!cols'] = rows[0].map((_, i) => ({ wch: Math.min(42, Math.max(8, ...rows.map(r => String(r[i] ?? '').length + 1))) }));
    X.utils.book_append_sheet(wb, ws, 'Du lieu'); X.writeFile(wb, `${name}.xlsx`);
  } catch {
    download(`${name}.csv`, new Blob([toCSV(rows)], { type: 'text/csv;charset=utf-8' }));
    toast('Không tải được thư viện Excel (mất mạng?) – đã xuất file CSV, mở được bằng Excel.');
  }
}
function parseCSV(text) {
  const delim = (text.split('\n')[0].match(/;/g) || []).length > (text.split('\n')[0].match(/,/g) || []).length ? ';' : ',';
  const rows = []; let row = [], cell = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (q) { if (ch === '"' && text[i + 1] === '"') { cell += '"'; i++; } else if (ch === '"') q = false; else cell += ch; }
    else if (ch === '"') q = true;
    else if (ch === delim) { row.push(cell); cell = ''; }
    else if (ch === '\n' || ch === '\r') { if (ch === '\r' && text[i + 1] === '\n') i++; row.push(cell); rows.push(row); row = []; cell = ''; }
    else cell += ch;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  return rows.filter(r => r.some(c => String(c).trim()));
}
async function readSheet(file) {
  if (/\.csv$/i.test(file.name)) return parseCSV((await file.text()).replace(/^﻿/, ''));
  const X = await loadXLSX(), wb = X.read(await file.arrayBuffer());
  return X.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1, defval: '' }).filter(r => r.some(c => String(c).trim()));
}
// Maps header names (any accents/case) to field keys.
function colMap(header, aliases) {
  const h = header.map(x => fold(x).trim());
  return Object.fromEntries(Object.entries(aliases).map(([k, names]) => [k, h.findIndex(x => names.includes(x))]));
}
const ITEM_COLS = { sku: ['ma hang', 'sku', 'ma'], name: ['ten hang', 'ten', 'ten mat hang'], type: ['loai'], unit: ['don vi', 'dvt', 'don vi tinh'], stock: ['ton', 'ton dau ky', 'so luong'], threshold: ['nguong', 'nguong canh bao'], price: ['gia nhap', 'don gia', 'gia'], category: ['danh muc'] };
const CUST_COLS = { name: ['ten khach', 'ten', 'khach hang', 'ho ten', 'ten khach hang'], phone: ['so dien thoai', 'sdt', 'dien thoai'], email: ['email'], address: ['dia chi'], note: ['ghi chu'] };

function importItems(rows) {
  const m = colMap(rows[0], ITEM_COLS);
  if (m.sku < 0 || m.name < 0) throw new Error('Thiếu cột “Mã hàng” hoặc “Tên hàng”.');
  let add = 0, upd = 0, skip = 0;
  const cell = (r, k) => (m[k] >= 0 ? String(r[m[k]] ?? '').trim() : '');
  for (const r of rows.slice(1)) {
    const sku = cell(r, 'sku'), name = cell(r, 'name');
    if (!sku || !name) { skip++; continue; }
    let catId = '';
    if (cell(r, 'category')) {
      let k = db.categories.find(x => fold(x.name) === fold(cell(r, 'category')));
      if (!k) { k = { id: uid(), name: cell(r, 'category'), fields: [] }; db.categories.push(k); }
      catId = k.id;
    }
    const data = { name, unit: cell(r, 'unit') || 'cái', threshold: +cell(r, 'threshold') || 0, lastPrice: parseMoney(cell(r, 'price')), ...(catId ? { categoryId: catId } : {}) };
    const ex = db.items.find(i => fold(i.sku) === fold(sku));
    if (ex) { Object.assign(ex, { name, threshold: data.threshold, ...(data.lastPrice ? { lastPrice: data.lastPrice } : {}), ...(catId ? { categoryId: catId } : {}) }); upd++; continue; }
    const it = { id: uid(), sku, type: fold(cell(r, 'type')).includes('thanh pham') ? 'finished' : 'material', stock: Math.max(0, +cell(r, 'stock') || 0), attrs: {}, categoryId: '', ...data };
    db.items.push(it); add++;
    if (it.stock) db.moves.push({ id: uid(), date: today(), itemId: it.id, type: 'nhap', qty: it.stock, price: it.lastPrice, ref: '', note: 'Tồn đầu kỳ (nhập từ Excel)' });
  }
  return `Mặt hàng: thêm ${add}, cập nhật ${upd}${skip ? `, bỏ qua ${skip} dòng thiếu mã/tên` : ''}. Hàng đã có không đổi số tồn.`;
}
function importCustomers(rows) {
  const m = colMap(rows[0], CUST_COLS);
  if (m.name < 0) throw new Error('Thiếu cột “Tên khách”.');
  let add = 0, upd = 0;
  const cell = (r, k) => (m[k] >= 0 ? String(r[m[k]] ?? '').trim() : '');
  for (const r of rows.slice(1)) {
    const name = cell(r, 'name'); if (!name) continue;
    const data = { name, phone: cell(r, 'phone'), email: cell(r, 'email'), address: cell(r, 'address'), note: cell(r, 'note') };
    const digits = data.phone.replace(/\D/g, '');
    const ex = db.customers.find(c => (digits && c.phone?.replace(/\D/g, '') === digits) || fold(c.name) === fold(name));
    if (ex) { Object.assign(ex, Object.fromEntries(Object.entries(data).filter(([, v]) => v))); upd++; }
    else { db.customers.push({ id: uid(), code: WC.nextCode('KH', db.customers), createdAt: today(), ...data }); add++; }
  }
  return `Khách hàng: thêm ${add}, cập nhật ${upd} (trùng SĐT hoặc tên).`;
}

/* ---------- actions ---------- */
const byId = (list, id) => db[list].find(x => x.id === id);
const go = hash => { if (location.hash === hash) render(); else location.hash = hash; };
const ROW_TPL = { order: orderLine, mat: matLine, cost: costLine, receipt: receiptLine };
const acts = {
  close: () => dlg.close(),
  print: () => window.print(),
  tab: d => { ui[d.key] = d.val; render(); },
  'tab-go': (d, b) => { ui[d.key] = d.val; go(b.getAttribute('href')); },
  'goto-order': d => {
    const o = byId('orders', d.id); dlg.close();
    ui.ordersSub = 'don'; ui.orderTab = o.status; ui.open.add(o.id); go('#/don-hang');
    setTimeout(() => $(`details[data-id="${o.id}"]`)?.scrollIntoView({ block: 'start', behavior: 'smooth' }), 50);
  },
  period: d => { ui.period = d.val; render(); },
  'period-shift': d => { ui.pdate = WC.shiftPeriod(ui.period, ui.pdate, +d.n); render(); },
  'close-go': (d, b) => { dlg.close(); go(b.getAttribute('href')); },
  'order-new': d => orderForm(null, { cust: d.cust }),
  'order-edit': d => orderForm(byId('orders', d.id)),
  'order-copy': d => { const o = byId('orders', d.id); orderForm(null, { copy: { customerId: o.customerId, priority: o.priority, lines: o.lines.map(l => ({ ...l })), materials: (o.materials || []).map(m => ({ ...m })), deposit: o.deposit, note: o.note, process: o.process && { steps: o.process.steps.map(s => ({ ...s, id: '', status: 'cho', doneAt: '' })) } } }); },
  'order-status': d => {
    const o = byId('orders', d.id);
    try {
      if (d.to === 'xong') finishOrder(o);
      else if (o.status === 'cho' && d.to === 'dang') { startOrder(o); toast(`${o.code}: bắt đầu làm${o.materials?.length ? ', đã xuất vật tư' : ''}`); }
      else { o.status = d.to; o.doneAt = ''; toast(`${o.code}: ${STATUS[d.to]}`); }
      ui.orderTab = o.status; save(); render();
    } catch (err) { toast(err.message); }
  },
  'order-cancel': (d, b) => armed(b, 'Bấm lần nữa để huỷ đơn', () => {
    const o = byId('orders', d.id); o.status = 'huy';
    const moved = runPromote(); save(); render();
    toast(`Đã huỷ ${o.code}.${o.materialsIssued ? ' Vật tư đã xuất không tự nhập lại – dùng Kho → Điều chỉnh nếu còn dùng được.' : ''}${moved.length ? ` ${moved.map(x => x.code).join(', ')} lên “Đang làm”.` : ''}`);
  }),
  'pay-new': d => paymentForm(byId('orders', d.id)),
  'cost-edit': d => costForm(byId('orders', d.id)),
  'bill-new': d => {
    const o = byId('orders', d.id), b = { id: uid(), code: WC.nextCode('HD-', db.bills), orderId: o.id, date: today(), dueDate: addDays(today(), 15), status: 'nhap', snap: billSnap(o) };
    db.bills.push(b); save(); render(); billView(b);
  },
  'bill-view': d => billView(byId('bills', d.id)),
  'bill-refresh': d => { const b = byId('bills', d.id); b.snap = billSnap(order(b.orderId)); save(); billView(b); toast('Đã cập nhật hoá đơn nháp từ đơn'); },
  'bill-issue': d => { const b = byId('bills', d.id); b.status = 'phathanh'; b.date = today(); save(); render(); billView(b); toast(`Đã phát hành ${b.code} – nội dung đã khoá`); },
  'bill-void': (d, b) => armed(b, 'Bấm lần nữa để huỷ', () => { const x = byId('bills', d.id); x.status = 'huy'; save(); render(); billView(x); toast(`Đã huỷ ${x.code}, vẫn giữ trong lịch sử`); }),
  'expense-new': () => expenseForm(),
  'expense-del': (d, b) => armed(b, 'Xoá thật?', () => { db.expenses = db.expenses.filter(x => x.id !== d.id); save(); render(); toast('Đã xoá khoản chi'); }),
  'cust-new': () => custForm(),
  'cust-edit': d => custForm(byId('customers', d.id)),
  'receipt-new': d => receiptForm(d.item),
  'move-new': d => moveForm(byId('items', d.id)),
  'item-new': () => itemForm(),
  'item-edit': d => itemForm(byId('items', d.id)),
  'cat-new': () => categoryForm(),
  'cat-edit': d => categoryForm(byId('categories', d.id)),
  'emp-new': () => empForm(),
  'emp-edit': d => empForm(byId('employees', d.id)),
  'task-new': d => taskForm({ order: d.order, group: d.group }),
  'task-accept': d => {
    const t = byId('tasks', d.id);
    Object.assign(t, { status: 'nhan', acceptedAt: nowStr(), acceptedBy: me(), empId: t.empId || me() });
    notify('owner', `${meName()} đã nhận việc: ${t.text}`); save(); render(); toast(`Đã nhận ${t.code} – chủ xưởng được báo`);
  },
  'task-done': d => {
    const t = byId('tasks', d.id);
    Object.assign(t, { status: 'xong', doneAt: nowStr(), review: null });
    notify('owner', `${meName()} đã xong: ${t.text}`); save(); render(); toast(`Đã báo xong ${t.code}, chờ chủ xưởng kiểm tra`);
  },
  'task-issue': d => issueForm(byId('tasks', d.id)),
  'task-ok': d => {
    const t = byId('tasks', d.id); t.review = { ok: true, note: '', at: nowStr() };
    notify(t.acceptedBy || t.empId, `Chủ xưởng đã kiểm tra ${t.code}: đạt`); save(); render(); toast(`${t.code}: đã kiểm tra`);
  },
  'task-redo': d => redoForm(byId('tasks', d.id)),
  'task-cancel': (d, b) => armed(b, 'Bấm lần nữa để huỷ', () => {
    const t = byId('tasks', d.id);
    notify(WC.taskTargets(t, db.employees), `Chủ xưởng đã huỷ việc ${t.code}: ${t.text}`);
    db.tasks = db.tasks.filter(x => x !== t); db.messages = db.messages.filter(m => m.taskId !== t.id); save(); render(); toast(`Đã huỷ ${t.code}`);
  }),
  channel: d => { ui.channel = d.id; render(); $('.composer input[name=text]')?.focus(); },
  notifs: () => notifSheet(),
  'notif-go': (d, b) => {
    const n = byId('notifs', d.id), q = new URLSearchParams(n.link.split('?')[1] || '');
    n.read = true; save(); dlg.close();
    if (n.link.startsWith('#/giao-viec')) { ui.workTab = q.get('tab') === 'chat' ? 'chat' : 'viec'; ui.channel = q.get('ch') || ui.channel; }
    go(n.link.split('?')[0]);
  },
  'notif-readall': () => { db.notifs.forEach(n => { if (n.to === me()) n.read = true; }); save(); render(); notifSheet(); },
  'notif-perm': async () => { await Notification.requestPermission(); render(); if (Notification.permission === 'granted') { toast('Đã bật thông báo trên máy này'); sysNotify(); } },
  logout: () => logout(),
  'pw-change': () => pwChangeForm(),
  'acc-new': () => accountForm(),
  'acc-pw': d => accPwForm(LIVE.users.find(u => u.id === d.id)),
  'acc-toggle': async (d, b) => {
    const u = LIVE.users.find(x => x.id === d.id);
    const go = async () => { try { await api(`users/${u.id}`, { active: !u.active }); toast(u.active ? `Đã khoá ${u.name}` : `Đã mở khoá ${u.name}`); loadAccounts(); } catch (err) { toast(err.message); } };
    if (u.active) armed(b, 'Bấm lần nữa để khoá', go); else go();
  },
  'group-new': () => groupForm(),
  'group-edit': d => groupForm(byId('groups', d.id)),
  'report-new': () => reportForm(),
  'report-edit': d => reportForm(byId('reports', d.id)),
  photo: d => {
    const src = d.kind === 'task' ? byId('tasks', d.id).issue.photos[+d.k] : d.kind === 'msg' ? byId('messages', d.id).photo : byId('reports', d.id).photos[+d.k];
    openSheet({ title: 'Ảnh', body: `<img class="photo-big" src="${src}" alt="Ảnh phóng to">` });
  },
  'note-new': d => noteForm(d.type),
  'note-resolve': d => { const n = byId('notes', d.id); n.status = 'resolved'; n.resolvedAt = today(); save(); render(); toast('Đã đánh dấu xử lý'); },
  'note-approve': d => { const n = byId('notes', d.id); n.status = 'approved'; n.resolvedAt = today(); save(); render(); toast('Đã duyệt đề xuất'); },
  'note-reject': d => { const n = byId('notes', d.id); n.status = 'rejected'; n.resolvedAt = today(); save(); render(); toast('Đã từ chối đề xuất'); },
  'block-new': () => blockForm(),
  'block-edit': d => blockForm(byId('blocks', d.id)),
  'block-del': (d, b) => armed(b, 'Xoá thật?', () => { db.blocks = db.blocks.filter(x => x.id !== d.id); save(); render(); toast('Đã xoá block (các đơn cũ giữ nguyên)'); }),
  'block-move': d => { const i = db.blocks.findIndex(x => x.id === d.id), j = i + +d.n; if (j < 0 || j >= db.blocks.length) return; [db.blocks[i], db.blocks[j]] = [db.blocks[j], db.blocks[i]]; save(); render(); },
  'add-row': (d, b) => { const f = b.closest('form'); $(`[data-rows=${d.kind}]`, f).insertAdjacentHTML('beforeend', ROW_TPL[d.kind]()); f.dispatchEvent(new Event('input')); },
  'rm-row': (d, b) => { const f = b.closest('form'), box = b.closest('.lines'); if (box.dataset.rows !== 'order' || box.children.length > 1) { b.closest('.line').remove(); f.dispatchEvent(new Event('input')); } },
  'step-add': (d, b) => { const f = b.closest('form'), blk = byId('blocks', d.id); $('.steps', f).insertAdjacentHTML('beforeend', stepRow({ blockId: blk.id, name: blk.name, color: blk.color, days: blk.days })); f.dispatchEvent(new Event('input')); },
  'step-all': (d, b) => { const f = b.closest('form'); $('.steps', f).insertAdjacentHTML('beforeend', db.blocks.map(blk => stepRow({ blockId: blk.id, name: blk.name, color: blk.color, days: blk.days })).join('')); f.dispatchEvent(new Event('input')); },
  'step-move': (d, b) => { const row = b.closest('.step'), sib = +d.n < 0 ? row.previousElementSibling : row.nextElementSibling; if (sib && !$('.chip', sib)) { if (+d.n < 0) sib.before(row); else sib.after(row); } },
  'step-rm': (d, b) => { const f = b.closest('form'); b.closest('.step').remove(); f.dispatchEvent(new Event('input')); },
  'step-start': d => {
    const o = byId('orders', d.id), s = o.process.steps[WC.currentStep(o.process)];
    try { if (o.status === 'cho') { startOrder(o); ui.orderTab = 'dang'; } } catch (err) { return toast(err.message); }
    s.status = 'dang'; save(); render(); toast(`${o.code}: bắt đầu “${s.name}”`);
  },
  'step-done': d => {
    const o = byId('orders', d.id), st = o.process.steps, c = WC.currentStep(o.process);
    st[c].status = 'xong'; st[c].doneAt = today();
    if (st[c + 1]) st[c + 1].status = 'dang'; // workers move straight to the next step
    save(); render();
    toast(st[c + 1] ? `Xong “${st[c].name}”, chuyển sang “${st[c + 1].name}”` : `${o.code}: xong mọi công đoạn – bấm “Hoàn thành” để chốt đơn.`);
  },
  'step-undo': d => {
    const o = byId('orders', d.id), st = o.process.steps, c = WC.currentStep(o.process), p = c < 0 ? st.length - 1 : c - 1;
    if (c >= 0) st[c].status = 'cho';
    st[p].status = 'dang'; st[p].doneAt = '';
    save(); render(); toast(`Đã hoàn tác “${st[p].name}”`);
  },
  'att-day': d => { ui.attDate = addDays(ui.attDate, +d.n); render(); },
  'att-set': d => {
    const day = (db.att[ui.attDate] ||= {}), cur = day[d.e];
    if (cur?.s === d.s) delete day[d.e]; // tap again to clear
    else day[d.e] = { s: d.s, in: ATT[d.s].w ? cur?.in || db.meta.shiftStart : '', out: ATT[d.s].w ? cur?.out || '' : '' };
    save(); render();
  },
  'att-all': d => {
    const day = (db.att[ui.attDate] ||= {}); let n = 0;
    for (const e of activeEmps()) if (!day[e.id] && (d.g === undefined || (e.groupId || '') === d.g)) { day[e.id] = { s: 'co', in: db.meta.shiftStart, out: '' }; n++; }
    save(); render(); toast(n ? `Đã đánh dấu ${n} người có mặt` : 'Mọi người đã được chấm công');
  },
  'export-orders': () => exportSheet(`don-hang-${today()}`, [['Mã đơn', 'Khách hàng', 'Ưu tiên', 'Trạng thái', 'Bắt đầu', 'Kết thúc dự kiến', 'Khách nhận', 'Giá trị', 'Cọc yêu cầu', 'Đã thu', 'Còn lại', ...(can('fin') ? ['Giá vốn', 'Lãi'] : []), 'Công đoạn hiện tại', 'Hàng', 'Ghi chú'],
    ...db.orders.map(o => { const f = WC.finance(o, db.moves), c = WC.currentStep(o.process); return [o.code, cust(o.customerId).name, o.priority, STATUS[o.status], fdate(o.start), fdate(o.end), fdate(o.due), f.value, f.deposit, f.received, f.balance, ...(can('fin') ? [f.cost, f.profit] : []), !o.process ? '' : c < 0 ? 'Đã xong' : o.process.steps[c].name, o.lines.map(l => `${l.name} x${l.qty}`).join('; '), o.note]; })]),
  'export-receipts': () => exportSheet(`phieu-nhap-${today()}`, [['Số phiếu', 'Ngày', 'Nhà cung cấp', 'Mặt hàng', 'SL', 'ĐVT', 'Đơn giá', 'Thành tiền'],
    ...db.receipts.flatMap(r => r.lines.map(l => [r.code, fdate(r.date), r.supplier, item(l.itemId).name, l.qty, item(l.itemId).unit, l.price, l.qty * l.price]))]),
  'export-ledger': () => { const [a, b] = WC.periodRange(ui.period, ui.pdate); exportSheet(`so-thu-chi-${a}-${b}`, [['Ngày', 'Thu/Chi', 'Loại', 'Nội dung', 'Chứng từ', 'Hình thức', 'Thu', 'Chi', 'Ghi chú'],
    ...WC.moneyLedger(db).filter(r => r.date >= a && r.date <= b).map(r => [fdate(r.date), r.dir === 'in' ? 'Thu' : 'Chi', r.kind, r.label, r.ref, METHOD_L[r.method] || '', r.dir === 'in' ? r.amount : '', r.dir === 'out' ? r.amount : '', r.note])]); },
  'export-costing': () => exportSheet(`gia-thanh-don-${today()}`, [['Mã đơn', 'Khách', 'Trạng thái', 'Giá trị', 'Cọc yêu cầu', 'Đã thu', 'Còn lại', 'Vật tư', 'Chi phí khác', 'Giá vốn', 'Lãi', 'Biên %', 'Chốt giá thành'],
    ...db.orders.filter(o => o.status !== 'huy').map(o => { const f = WC.finance(o, db.moves); return [o.code, cust(o.customerId).name, STATUS[o.status], f.value, f.deposit, f.received, f.balance, f.mat, f.extra, f.cost, f.profit, Math.round(f.margin * 100), o.costFinal ? 'Đã chốt' : 'Tạm tính']; })]),
  'export-bills': () => exportSheet(`hoa-don-${today()}`, [['Số HĐ', 'Ngày', 'Hạn thanh toán', 'Khách hàng', 'Địa chỉ', 'Đơn hàng', 'Hàng hoá', 'SL', 'Đơn giá', 'Thành tiền', 'Trạng thái'],
    ...db.bills.flatMap(b => b.snap.lines.map(l => [b.code, fdate(b.date), fdate(b.dueDate), b.snap.customer.name, b.snap.customer.address, b.snap.orderCode, l.name, l.qty, l.price, l.qty * l.price, BILL_L[b.status]]))]),
  'export-att': () => {
    const [y, m] = ui.month.split('-').map(Number), days = new Date(y, m, 0).getDate();
    const cols = Array.from({ length: days }, (_, i) => `${ui.month}-${String(i + 1).padStart(2, '0')}`);
    exportSheet(`bang-cong-${ui.month}`, [['Mã NV', 'Họ tên', ...cols.map(c => +c.slice(8)), 'Công', 'Muộn', 'Phép', 'Vắng'],
      ...activeEmps().map(e => { const t = WC.attTotals(db.att, e.id, ui.month); return [e.code, e.name, ...cols.map(c => (db.att[c]?.[e.id] ? ATT[db.att[c][e.id].s].sym : '')), t.cong, t.muon, t.phep, t.vang]; })]);
  },
  'tpl-items': () => exportSheet('mau-nhap-mat-hang', [['Mã hàng', 'Tên hàng', 'Loại', 'Đơn vị', 'Tồn', 'Ngưỡng', 'Giá nhập', 'Danh mục'], ['GO-CAO-SU-15', 'Ván gỗ cao su 15mm', 'Nguyên vật liệu', 'tấm', 20, 10, 520000, 'Gỗ & ván'], ['TP-GHE-BAR', 'Ghế bar gỗ', 'Thành phẩm', 'cái', 0, 0, '', 'Bàn ghế thành phẩm']]),
  'tpl-customers': () => exportSheet('mau-nhap-khach-hang', [['Tên khách', 'Số điện thoại', 'Email', 'Địa chỉ', 'Ghi chú'], ['Cty TNHH Mẫu', '0900 123 456', 'lienhe@example.com', 'Q.1, TP.HCM', 'Khách sỉ']]),
  'export-json': () => download(`warecon-sao-luu-${today()}.json`, new Blob([JSON.stringify(db, null, 1)], { type: 'application/json' })),
  reset: (d, b) => armed(b, 'Bấm lần nữa để xoá hết và đặt lại', () => { db = makeSeed(today()); save(); render(); toast('Đã đặt lại dữ liệu mẫu'); }),
  install: async () => { const e = window.__installEvt; if (!e) return; e.prompt(); await e.userChoice; window.__installEvt = null; render(); },
};

document.addEventListener('click', e => {
  const b = e.target.closest('[data-act]');
  if (b && acts[b.dataset.act] && !b.disabled) { e.preventDefault(); acts[b.dataset.act](b.dataset, b, e); }
});
document.addEventListener('toggle', e => {
  const d = e.target; if (d.matches?.('details[data-id]')) d.open ? ui.open.add(d.dataset.id) : ui.open.delete(d.dataset.id);
}, true);
document.addEventListener('input', e => { if (e.target.matches('[data-search]')) { ui.q = e.target.value; if (currentList) $('#list').innerHTML = currentList(); } });
document.addEventListener('focusout', e => { if (e.target.matches('[data-money]') && e.target.value) e.target.value = num(parseMoney(e.target.value)); });
document.addEventListener('change', async e => {
  const t = e.target, k = t.dataset.change; if (!k) return;
  if (k === 'role') {
    const [r, id] = t.value.split(':'); db.meta.role = r; if (id) db.meta.meId = id;
    ui.channel = ''; save(); render();
    const un = unreadNotifs().length;
    toast(`Đang xem như ${meName()}${un ? ` – có ${un} thông báo chưa đọc` : ''}`); sysNotify();
  }
  if (k === 'msg-photo' && t.files[0]) {
    try {
      const form = t.closest('form'), photo = await storePhoto(await compressImage(t.files[0]));
      sendMessage(form.dataset.ch, form.elements.text.value.trim(), photo);
    } catch (err) { toast(err.message); }
    t.value = '';
  }
  if (k === 'att-date' && t.value) { ui.attDate = t.value; render(); }
  if (k === 'att-month' && t.value) { ui.month = t.value; render(); }
  if (k === 'att-time') { const r = db.att[ui.attDate]?.[t.dataset.e]; if (r) { r[t.dataset.f] = t.value; save(); } }
  if (k === 'import-items' || k === 'import-customers') {
    try {
      const rows = await readSheet(t.files[0]);
      if (rows.length < 2) throw new Error('File không có dữ liệu.');
      const msg = k === 'import-items' ? importItems(rows) : importCustomers(rows);
      save(); render(); toast(msg);
    } catch (err) { toast(err.message === 'offline' ? 'Cần mạng để đọc file .xlsx – hoặc lưu file dạng CSV rồi nhập lại.' : err.message); }
    t.value = '';
  }
  if (k === 'import-json') {
    try {
      const data = JSON.parse(await t.files[0].text());
      if (data.v !== 4 || !Array.isArray(data.tasks) || !Array.isArray(data.orders) || !Array.isArray(data.items)) throw new Error();
      db = data; save(); render(); toast('Đã khôi phục dữ liệu từ file');
    } catch { toast('File không đúng định dạng sao lưu Warecon.'); }
    t.value = '';
  }
});
document.addEventListener('submit', e => {
  if (e.target.dataset.form === 'msg') {
    e.preventDefault();
    const text = e.target.elements.text.value.trim();
    if (text) sendMessage(e.target.dataset.ch, text, '');
    return;
  }
  if (e.target.dataset.form !== 'meta') return;
  e.preventDefault(); const f = e.target;
  db.meta = { ...db.meta, name: val(f, 'name'), shiftStart: val(f, 'shiftStart') || '07:30', capacity: Math.max(1, +val(f, 'capacity') || 1), ignoreLock: f.elements.ignoreLock.checked };
  const moved = runPromote();
  save(); render(); toast('Đã lưu cài đặt xưởng' + (moved.length ? ` – đưa ${moved.map(o => o.code).join(', ')} lên “Đang làm”` : ''));
});

/* ---------- PWA + boot ---------- */
addEventListener('beforeinstallprompt', e => { e.preventDefault(); window.__installEvt = e; const b = $('#installBtn'); if (b) b.hidden = false; });
if ('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('sw.js').catch(() => {});
// boot() in sync.js decides: server mode (login) or demo mockup.
