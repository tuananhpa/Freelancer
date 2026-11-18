// Pure business rules, shared by the app and tests/check.js. No DOM here.
(function (root) {
  const PRI = ['G1', 'G2', 'G3', 'G4'];
  const ATT = {
    co:   { l: 'Có mặt',    s: 'Có',    sym: '✓', w: 1,   c: 'green' },
    muon: { l: 'Đi muộn',   s: 'Muộn',  sym: 'M', w: 1,   c: 'amber' },
    nua:  { l: 'Nửa ngày',  s: '½',     sym: '½', w: 0.5, c: 'blue'  },
    phep: { l: 'Nghỉ phép', s: 'Phép',  sym: 'P', w: 0,   c: 'slate' },
    vang: { l: 'Vắng',      s: 'Vắng',  sym: '✗', w: 0,   c: 'red'   },
  };

  const fold = s => String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[đĐ]/g, 'd').toLowerCase();
  const pad = n => String(n).padStart(2, '0');
  const localISO = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const addDays = (iso, n) => { const d = new Date(iso + 'T00:00:00'); d.setDate(d.getDate() + n); return localISO(d); };
  const daysBetween = (a, b) => Math.round((new Date(b + 'T00:00:00') - new Date(a + 'T00:00:00')) / 864e5);

  /* ---------- orders ---------- */
  const OPEN = ['cho', 'dang'];
  const orderValue = o => o.lines.reduce((s, l) => s + (+l.qty || 0) * (+l.price || 0), 0);
  const isLate = (o, today) => OPEN.includes(o.status) && o.due < today;
  // Queue order: priority G1→G4, then planned end date, then customer due date.
  const queueSort = (a, b) => PRI.indexOf(a.priority) - PRI.indexOf(b.priority) || (a.end || a.due).localeCompare(b.end || b.due) || a.due.localeCompare(b.due);

  // When a slot frees up, the best queued orders that are ready (materials in stock) move to "đang làm".
  // ready() is checked one order at a time, after onMove() of the previous one, so orders competing for the same stock are handled.
  function promote(orders, capacity, ready = () => true, onMove = () => {}) {
    let running = orders.filter(o => o.status === 'dang').length;
    const moved = [];
    for (const o of orders.filter(x => x.status === 'cho').sort(queueSort)) {
      if (running >= capacity) break;
      if (!ready(o)) continue;
      onMove(o); o.status = 'dang'; moved.push(o); running++;
    }
    return moved;
  }

  // Materials an order still needs from stock, with what is missing.
  const shortages = (o, items) => (o.materialsIssued ? [] : (o.materials || [])
    .map(m => { const it = items.find(i => i.id === m.itemId); return { item: it, need: m.qty, have: it ? it.stock : 0 }; })
    .filter(x => x.need > x.have));

  /* ---------- money ---------- */
  const PAY_SIGN = { coc: 1, tt: 1, hoan: -1 };
  const received = o => (o.payments || []).reduce((s, p) => s + PAY_SIGN[p.kind] * p.amount, 0);
  const materialCost = (o, moves) => moves.filter(m => m.type === 'xuat' && m.ref === o.code).reduce((s, m) => s + m.qty * (m.price || 0), 0);
  const extraCost = o => (o.costs || []).reduce((s, c) => s + (+c.amount || 0), 0);
  function finance(o, moves) {
    const value = orderValue(o), got = received(o), mat = materialCost(o, moves), extra = extraCost(o), cost = mat + extra;
    return { value, received: got, balance: value - got, deposit: o.deposit || 0, depositOk: got >= (o.deposit || 0), mat, extra, cost, profit: value - cost, margin: value ? (value - cost) / value : 0 };
  }

  // Every money movement in one list: customer payments in, purchases (phiếu nhập) and expenses out.
  function moneyLedger(db) {
    const cname = id => (db.customers.find(c => c.id === id) || {}).name || '';
    const rows = [];
    for (const o of db.orders) for (const p of o.payments || [])
      rows.push({ date: p.date, dir: p.kind === 'hoan' ? 'out' : 'in', amount: p.amount, kind: { coc: 'Tiền cọc', tt: 'Thanh toán', hoan: 'Hoàn tiền khách' }[p.kind], label: `${o.code} · ${cname(o.customerId)}`, ref: o.code, method: p.method, note: p.note || '' });
    for (const r of db.receipts)
      rows.push({ date: r.date, dir: 'out', amount: r.lines.reduce((s, l) => s + l.qty * l.price, 0), kind: 'Mua vật tư', label: `${r.code} · ${r.supplier}`, ref: r.code, method: '', note: r.note || '' });
    for (const e of db.expenses)
      rows.push({ date: e.date, dir: 'out', amount: e.amount, kind: e.category, label: e.note || e.category, ref: e.orderRef || '', method: '', note: '' });
    return rows.sort((a, b) => b.date.localeCompare(a.date));
  }

  function cashflow(ledger, from, to) {
    const t = { in: 0, out: 0, byKind: {} };
    for (const r of ledger) if (r.date >= from && r.date <= to) {
      t[r.dir] += r.amount;
      if (r.dir === 'out') t.byKind[r.kind] = (t.byKind[r.kind] || 0) + r.amount;
    }
    t.net = t.in - t.out;
    return t;
  }

  // [from, to] of the day / month / year containing iso.
  function periodRange(kind, iso) {
    if (kind === 'ngay') return [iso, iso];
    if (kind === 'thang') { const [y, m] = iso.split('-').map(Number); return [`${y}-${pad(m)}-01`, `${y}-${pad(m)}-${pad(new Date(y, m, 0).getDate())}`]; }
    return [`${iso.slice(0, 4)}-01-01`, `${iso.slice(0, 4)}-12-31`];
  }
  function shiftPeriod(kind, iso, n) {
    if (kind === 'ngay') return addDays(iso, n);
    const [y, m] = iso.split('-').map(Number);
    return kind === 'thang' ? localISO(new Date(y, m - 1 + n, 1)) : `${y + n}-01-01`;
  }

  /* ---------- stock ---------- */
  // type: nhap (+qty) | xuat (-qty) | dieuchinh (signed qty). Stock never goes below zero.
  function moveStock(stock, type, qty) {
    if (!(qty > 0) && type !== 'dieuchinh') throw new Error('Số lượng phải lớn hơn 0');
    const next = Math.round((stock + (type === 'xuat' ? -qty : qty)) * 1000) / 1000;
    if (next < 0) throw new Error('Không đủ tồn kho để xuất');
    return next;
  }
  // shortcut: suggests topping up to 2× the threshold, upgrade to a per-item reorder level when the shop asks.
  const reorderQty = it => (it.threshold > 0 && it.stock < it.threshold ? Math.ceil(it.threshold * 2 - it.stock) : 0);

  /* ---------- people & schedule ---------- */
  function attTotals(att, empId, month) {
    const t = { cong: 0, co: 0, muon: 0, nua: 0, phep: 0, vang: 0 };
    for (const [day, rec] of Object.entries(att)) {
      const r = day.startsWith(month) && rec[empId];
      if (r && ATT[r.s]) { t[r.s]++; t.cong += ATT[r.s].w; }
    }
    return t;
  }

  function nextCode(prefix, list, width = 3) {
    const max = list.reduce((m, x) => Math.max(m, +(String(x.code).match(/(\d+)$/) || [0, 0])[1]), 0);
    return prefix + String(max + 1).padStart(width, '0');
  }

  // Planned dates for each process step, counted in working days from the order start.
  // shortcut: only Sundays are off, upgrade to the factory calendar (holidays, closures) with the backend.
  function planSteps(start, steps, offDays = [0]) {
    const isOff = iso => offDays.includes(new Date(iso + 'T00:00:00').getDay());
    let day = start;
    return steps.map(s => {
      while (isOff(day)) day = addDays(day, 1);
      const from = day;
      for (let i = 1; i < Math.max(1, s.days); i++) { day = addDays(day, 1); while (isOff(day)) day = addDays(day, 1); }
      const to = day;
      day = addDays(day, 1);
      return { from, to };
    });
  }
  const currentStep = proc => (proc ? proc.steps.findIndex(s => s.status !== 'xong') : -1);

  // Which open orders occupy each day: process plan if any, else start → planned end (or due).
  function orderSpan(o) {
    if (o.process?.steps.length) { const p = planSteps(o.start, o.process.steps); return [p[0].from, p[p.length - 1].to]; }
    return [o.start, o.end || o.due];
  }
  function loadByDay(orders, from, days) {
    const to = addDays(from, days - 1), load = {};
    for (const o of orders) {
      if (!OPEN.includes(o.status)) continue;
      const [a, b] = orderSpan(o);
      for (let d = a < from ? from : a; d <= b && d <= to; d = addDays(d, 1)) (load[d] ||= []).push(o.code);
    }
    return load;
  }

  // Change proposals are open before the shift and until 30 minutes after it starts.
  function proposalOpen(now, shiftStart) {
    const [h, m] = shiftStart.split(':').map(Number);
    return now.getHours() * 60 + now.getMinutes() <= h * 60 + m + 30;
  }

  /* ---------- assigned work (giao việc) ---------- */
  // Status: moi (chờ nhận) → nhan (đã nhận, đang làm) → xong | loi (báo lỗi). The owner then reviews: ok, or sends it back to "nhan".
  const needsReview = t => (t.status === 'xong' || t.status === 'loi') && !t.review;
  // A worker sees tasks given to them, and whole-group tasks of their group nobody has taken yet.
  const taskVisibleTo = (t, empId, groupId) => t.empId === empId || (!t.empId && !!groupId && t.groupId === groupId);
  const taskTargets = (t, emps) => (t.empId ? [t.empId] : emps.filter(e => e.active && e.groupId === t.groupId).map(e => e.id));

  const api = { needsReview, taskVisibleTo, taskTargets, PRI, ATT, OPEN, fold, localISO, addDays, daysBetween, orderValue, isLate, queueSort, promote, shortages, received, materialCost, finance, moneyLedger, cashflow, periodRange, shiftPeriod, moveStock, reorderQty, attTotals, nextCode, planSteps, currentStep, orderSpan, loadByDay, proposalOpen };
  root.WC = api;
  if (typeof module !== 'undefined') module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
