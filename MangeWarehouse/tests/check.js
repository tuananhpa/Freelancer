// Run: node tests/check.js  — asserts the business rules in assets/logic.js and that the seed reconciles.
const assert = require('node:assert/strict');
const WC = require('../assets/logic.js');
globalThis.WC = WC;
const fs = require('node:fs');
eval(fs.readFileSync(__dirname + '/../assets/seed.js', 'utf8') + ';globalThis.makeSeed = makeSeed;');

// search ignores Vietnamese diacritics
assert.equal(WC.fold('Đơn hàng Gỗ Sồi'), 'don hang go soi');

// stock ledger never goes negative
assert.equal(WC.moveStock(10, 'nhap', 2.5), 12.5);
assert.equal(WC.moveStock(10, 'xuat', 4), 6);
assert.equal(WC.moveStock(10, 'dieuchinh', -3), 7);
assert.throws(() => WC.moveStock(1, 'xuat', 2), /Không đủ/);
assert.throws(() => WC.moveStock(1, 'nhap', 0), /lớn hơn 0/);

// promotion: fills free slots by priority, then end date, and skips orders that are not ready
const orders = [
  { code: 'A', status: 'dang', priority: 'G3', due: '2026-01-05' },
  { code: 'B', status: 'cho', priority: 'G3', due: '2026-01-09', end: '2026-01-01' },
  { code: 'C', status: 'cho', priority: 'G1', due: '2026-02-01' },
  { code: 'D', status: 'cho', priority: 'G3', due: '2026-01-02' },
  { code: 'E', status: 'cho', priority: 'G1', due: '2026-01-01', blocked: true },
];
assert.deepEqual(WC.promote(orders, 3, o => !o.blocked).map(o => o.code), ['C', 'B']);
assert.equal(orders.find(o => o.code === 'E').status, 'cho');

// materials shortage
const items = [{ id: 'm1', stock: 5 }, { id: 'm2', stock: 50 }];
assert.deepEqual(WC.shortages({ materials: [{ itemId: 'm1', qty: 8 }, { itemId: 'm2', qty: 10 }] }, items).map(x => x.need), [8]);
assert.deepEqual(WC.shortages({ materialsIssued: true, materials: [{ itemId: 'm1', qty: 8 }] }, items), []);

// order money: payments (refund subtracts), material cost from issued moves, extra costs, profit
const o = { code: 'DH-1', lines: [{ qty: 2, price: 5000000 }], deposit: 3000000, payments: [{ kind: 'coc', amount: 3000000 }, { kind: 'tt', amount: 4000000 }, { kind: 'hoan', amount: 500000 }], costs: [{ amount: 1000000 }] };
const f = WC.finance(o, [{ type: 'xuat', ref: 'DH-1', qty: 4, price: 500000 }, { type: 'xuat', ref: 'DH-2', qty: 9, price: 1 }, { type: 'nhap', ref: 'DH-1', qty: 1, price: 9 }]);
assert.deepEqual([f.value, f.received, f.balance, f.mat, f.cost, f.profit, f.depositOk], [10000000, 6500000, 3500000, 2000000, 3000000, 7000000, true]);

// periods and cash flow
assert.deepEqual(WC.periodRange('thang', '2026-02-10'), ['2026-02-01', '2026-02-28']);
assert.deepEqual(WC.periodRange('nam', '2026-02-10'), ['2026-01-01', '2026-12-31']);
assert.equal(WC.shiftPeriod('thang', '2026-01-31', -1), '2025-12-01');
const cf = WC.cashflow([{ date: '2026-11-02', dir: 'in', amount: 10 }, { date: '2026-11-03', dir: 'out', amount: 4, kind: 'Lương' }, { date: '2026-10-30', dir: 'in', amount: 99 }], '2026-11-01', '2026-11-30');
assert.deepEqual([cf.in, cf.out, cf.net, cf.byKind['Lương']], [10, 4, 6, 4]);

// reorder suggestion and attendance totals
assert.equal(WC.reorderQty({ stock: 4, threshold: 10 }), 16);
assert.equal(WC.reorderQty({ stock: 12, threshold: 10 }), 0);
const t = WC.attTotals({ '2026-11-02': { e: { s: 'co' } }, '2026-11-03': { e: { s: 'nua' } }, '2026-11-04': { e: { s: 'phep' } }, '2026-10-30': { e: { s: 'co' } } }, 'e', '2026-11');
assert.deepEqual([t.cong, t.nua, t.phep], [1.5, 1, 1]);
assert.equal(WC.nextCode('DH-', [{ code: 'DH-009' }, { code: 'DH-010' }]), 'DH-011');

// process plan: 2026-11-14 is a Saturday, Sunday 15 is skipped
assert.deepEqual(WC.planSteps('2026-11-14', [{ days: 1 }, { days: 2 }, { days: 1 }]),
  [{ from: '2026-11-14', to: '2026-11-14' }, { from: '2026-11-16', to: '2026-11-17' }, { from: '2026-11-18', to: '2026-11-18' }]);
assert.equal(WC.currentStep({ steps: [{ status: 'xong' }, { status: 'dang' }, { status: 'cho' }] }), 1);
assert.equal(WC.currentStep({ steps: [{ status: 'xong' }] }), -1);

// schedule load and proposal lock window
const load = WC.loadByDay([{ code: 'A', status: 'dang', start: '2026-11-01', due: '2026-11-03' }, { code: 'B', status: 'cho', start: '2026-11-03', end: '2026-11-04', due: '2026-11-09' }, { code: 'C', status: 'xong', start: '2026-11-01', due: '2026-11-30' }], '2026-11-02', 5);
assert.deepEqual(load['2026-11-03'], ['A', 'B']);
assert.equal(load['2026-11-05'], undefined);
assert.equal(WC.proposalOpen(new Date(2026, 0, 1, 7, 59), '07:30'), true);
assert.equal(WC.proposalOpen(new Date(2026, 0, 1, 8, 1), '07:30'), false);

// assigned work: visibility and review
assert.equal(WC.taskVisibleTo({ empId: 'e1', groupId: 'g1' }, 'e1', 'g2'), true);
assert.equal(WC.taskVisibleTo({ empId: '', groupId: 'g1' }, 'e2', 'g1'), true);
assert.equal(WC.taskVisibleTo({ empId: 'e1', groupId: 'g1' }, 'e2', 'g1'), false);
assert.equal(WC.taskVisibleTo({ empId: '', groupId: 'g1' }, 'e3', ''), false);
assert.deepEqual([WC.needsReview({ status: 'loi' }), WC.needsReview({ status: 'xong', review: { ok: true } }), WC.needsReview({ status: 'nhan' })], [true, false, false]);
assert.deepEqual(WC.taskTargets({ empId: '', groupId: 'g1' }, [{ id: 'a', active: true, groupId: 'g1' }, { id: 'b', active: false, groupId: 'g1' }, { id: 'c', active: true, groupId: 'g2' }]), ['a']);

// seed: ledger replays to the stock on hand and never dips below zero along the way
const db = makeSeed('2026-11-17');
for (const it of db.items) {
  const ms = db.moves.filter(m => m.itemId === it.id).sort((a, b) => a.date.localeCompare(b.date) || (a.type === 'xuat') - (b.type === 'xuat'));
  let bal = 0;
  for (const m of ms) { bal += m.type === 'xuat' ? -m.qty : m.qty; assert.ok(bal >= 0, `${it.sku} negative on ${m.date}`); }
  assert.equal(bal, it.stock, `ledger mismatch for ${it.sku}`);
}
for (const ord of db.orders) assert.ok(WC.received(ord) <= WC.orderValue(ord), `${ord.code} overpaid`);
console.log('all checks passed');
