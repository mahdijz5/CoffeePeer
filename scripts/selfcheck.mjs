// node scripts/selfcheck.mjs — checks the merge/replay and report logic every device relies on
import assert from 'node:assert/strict'
import { replay } from '../src/lib/reduce.js'
import { buildReport, bucketOf, net } from '../src/lib/reports.js'
import { toNum, normName } from '../src/lib/format.js'

const ev = (id, device, timestamp, op, payload) => ({ id, device, timestamp, op, data: [payload] })
const created = ev('e1', 'A', 1, 'item.created', { id: 'latte', title: 'Latte', price: 4, cost: 1, stock: 5 })
const stock = (events, id = 'latte') => replay(events).items[id].stock

// two devices work offline, then merge: deltas add up regardless of arrival order
const a = [created, ev('e2', 'A', 10, 'item.sold', { itemId: 'latte', quantity: 2 }), ev('e3', 'A', 30, 'item.restocked', { itemId: 'latte', quantity: 10 })]
const b = [ev('e4', 'B', 20, 'item.sold', { itemId: 'latte', quantity: 1 })]
assert.equal(stock([...a, ...b]), 5 - 2 - 1 + 10)
assert.deepEqual(replay([...b, ...a]), replay([...a, ...b]))

// duplicate event ids (same event pulled twice) count once
assert.equal(stock([...a, ...a, ...b, ...b]), 12)

// overselling while offline goes negative instead of being dropped
const oversold = [created, ev('s1', 'A', 2, 'item.sold', { itemId: 'latte', quantity: 4 }), ev('s2', 'B', 3, 'item.sold', { itemId: 'latte', quantity: 4 })]
assert.equal(stock(oversold), -3)

// price: last write wins
const prices = [created, ev('p1', 'A', 5, 'item.updated', { id: 'latte', price: 5 }), ev('p2', 'B', 6, 'item.updated', { id: 'latte', price: 6 })]
assert.equal(replay(prices).items.latte.price, 6)

// events for unknown items are ignored, not crashes
assert.deepEqual(replay([ev('x', 'A', 1, 'item.sold', { itemId: 'ghost', quantity: 1 })]).items, {})

// icon: set on create, replaced by update; items without one get ''
const withIcon = [ev('i1', 'A', 1, 'item.created', { id: 'mocha', title: 'Mocha', price: 5, stock: 1, icon: 'data:a' }), ev('i2', 'B', 2, 'item.updated', { id: 'mocha', icon: 'data:b' })]
assert.equal(replay(withIcon).items.mocha.icon, 'data:b')
assert.equal(replay([created]).items.latte.icon, '')

// restock is a plain quantity: old events carrying unitCost/supplier still work and don't touch the cost
const buy = [created, ev('b1', 'A', 2, 'item.restocked', { itemId: 'latte', quantity: 5, unitCost: 3, supplier: 'Roastery', note: 'beans' })]
const bought = replay(buy)
assert.deepEqual([bought.items.latte.cost, bought.items.latte.stock], [1, 10]) // cost is the item's own field
assert.equal('purchases' in bought, false)

// profit: sales keep the price/cost they were made at; later edits don't rewrite them
const sold = replay([
  created,
  ev('t1', 'A', 2, 'item.sold', { itemId: 'latte', quantity: 2, price: 4, cost: 1 }),
  ev('t2', 'A', 3, 'item.updated', { id: 'latte', price: 10, cost: 5 }),
  ev('t3', 'A', 4, 'item.sold', { itemId: 'latte', quantity: 1 }), // legacy-style: falls back to current price/cost
])
assert.deepEqual(sold.sales.map((s) => s.profit), [6, 5])
assert.equal(sold.items.latte.profit, 11)
assert.equal(sold.items.latte.revenue, 8 + 10)

// reports: Saturday-based weeks, Jalali months, totals add up
const DAY = 86_400_000
const t0 = new Date(2026, 9, 17, 12).getTime() // a Saturday (local)
assert.equal(new Date(t0).getDay(), 6)
assert.equal(bucketOf(t0 + 6 * DAY, 'week').key, bucketOf(t0, 'week').key) // Sat..Fri share a week
assert.notEqual(bucketOf(t0 + 7 * DAY, 'week').key, bucketOf(t0, 'week').key)
assert.equal(bucketOf(t0, 'day').key, bucketOf(t0 + 3600_000, 'day').key)
assert.notEqual(bucketOf(t0, 'month').key, bucketOf(t0 + 40 * DAY, 'month').key)
const sale = (id, ts, qty, price, cost) => ({ id, ts, itemId: 'latte', title: 'Latte', qty, price, cost, revenue: qty * price, profit: qty * (price - cost) })
const rep = buildReport([sale('a', t0, 2, 10, 4), sale('b', t0 + 3600_000, 1, 10, 4), sale('c', t0 + 2 * DAY, 1, 10, 4)], 'day')
assert.equal(rep.buckets.length, 2)
assert.deepEqual([rep.totals.revenue, rep.totals.profit, rep.totals.cogs], [40, 24, 16])
assert.equal(rep.buckets[0].revenue, 30)

// removing an item hides it but keeps its history and profit
const gone = replay([
  created,
  ev('r1', 'A', 2, 'item.sold', { itemId: 'latte', quantity: 1, price: 4, cost: 1 }),
  ev('r2', 'A', 3, 'item.restocked', { itemId: 'latte', quantity: 2, unitCost: 1 }),
  ev('r3', 'A', 4, 'item.removed', { id: 'latte' }),
])
assert.equal(gone.items.latte.removed, true)
assert.deepEqual([gone.sales.length, gone.items.latte.profit], [1, 3])
assert.equal(replay([created]).items.latte.removed, false)

// voiding a sale: stock back, sale and profit gone, other sales untouched
const accident = [created, ev('v1', 'A', 2, 'item.sold', { itemId: 'latte', quantity: 1, price: 4, cost: 1 }), ev('v2', 'A', 3, 'item.sold', { itemId: 'latte', quantity: 2, price: 4, cost: 1 })]
const undone = replay([...accident, ev('v3', 'A', 4, 'history.voided', { id: 'v1' })])
assert.deepEqual([undone.items.latte.stock, undone.sales.map((s) => s.id), undone.items.latte.profit], [3, ['v2'], 6])
// the void still works when a wrong phone clock stamps it before the sale
assert.deepEqual(replay([...accident, ev('v3', 'B', 1, 'history.voided', { id: 'v1' })]), undone)
// voiding a restock takes its stock back; voiding an unknown id changes nothing
const voidedBuy = replay([...buy, ev('v4', 'A', 9, 'history.voided', { id: 'b1' })])
assert.equal(voidedBuy.items.latte.stock, 5)
assert.deepEqual(replay([...accident, ev('v5', 'A', 9, 'history.voided', { id: 'nope' })]), replay(accident))

// detailed sell: customer + note on the sale; customers derived per normalized name
const sell = (id, ts, qty, extra) => ev(id, 'A', ts, 'item.sold', { itemId: 'latte', quantity: qty, price: 4, cost: 1, ...extra })
const withCust = replay([
  created,
  sell('k1', 2, 2, { customer: 'علي  رضا', note: 'بدون شکر' }),
  sell('k2', 3, 1, { customer: 'علی\u200cرضا' }), // same person: Arabic ي vs Persian ی, ZWNJ vs space
  sell('k3', 4, 1, { customer: 'سارا' }),
  sell('k4', 5, 1, { customer: '   ' }), // blank name: not a customer
  sell('k5', 6, 1, {}), // plain one-tap sale
])
assert.equal(withCust.customers.length, 2)
const ali = withCust.customers.find((c) => c.key === normName('علی رضا'))
assert.deepEqual([ali.sales, ali.units, ali.revenue, ali.profit, ali.name], [2, 3, 12, 9, 'علی\u200cرضا'])
assert.equal(withCust.customers[0].name, 'سارا') // newest purchase first
assert.deepEqual(withCust.sales.map((x) => [x.customer, x.note]), [['علي  رضا', 'بدون شکر'], ['علی\u200cرضا', ''], ['سارا', ''], ['', ''], ['', '']])
assert.equal(withCust.items.latte.stock, 5 - 2 - 1 - 1 - 1 - 1)
// voiding a customer's only sale removes the customer; their other sales stay
const voidedCust = replay([created, sell('k1', 2, 2, { customer: 'سارا' }), sell('k2', 3, 1, { customer: 'علی' }), ev('kv', 'A', 4, 'history.voided', { id: 'k1' })])
assert.deepEqual(voidedCust.customers.map((c) => c.name), ['علی'])

// customer rename: history names change, merging into an existing customer works, later sales aren't touched
const base = [created, sell('n1', 2, 1, { customer: 'علی' }), sell('n2', 3, 2, { customer: 'سارا' }), sell('n3', 4, 1, { customer: 'علي' })]
const renamed = replay([...base, ev('rn', 'A', 5, 'customer.renamed', { from: 'علی', to: 'علی رضایی' })])
assert.deepEqual(renamed.customers.map((c) => [c.name, c.sales]).sort(), [['سارا', 1], ['علی رضایی', 2]].sort()) // ي/ی spellings both renamed
assert.deepEqual(renamed.sales.map((x) => x.customer), ['علی رضایی', 'سارا', 'علی رضایی'])
const merged = replay([...base, ev('rm', 'A', 5, 'customer.renamed', { from: 'سارا', to: 'علی' })])
assert.deepEqual(merged.customers.map((c) => [c.name, c.sales, c.units]), [['علی', 3, 4]])
const later = replay([...base, ev('rl', 'A', 5, 'customer.renamed', { from: 'علی', to: 'رضا' }), sell('n4', 6, 1, { customer: 'علی' })])
assert.deepEqual(later.customers.map((c) => c.name).sort(), ['رضا', 'سارا', 'علی'].sort()) // sale after the rename = a new "علی"
const chain = replay([...base, ev('c1', 'A', 5, 'customer.renamed', { from: 'علی', to: 'رضا' }), ev('c2', 'A', 6, 'customer.renamed', { from: 'رضا', to: 'حسن' })])
assert.deepEqual(chain.customers.map((c) => c.name).sort(), ['حسن', 'سارا'].sort())
assert.deepEqual(replay([...base, ev('b1', 'A', 5, 'customer.renamed', { from: 'علی', to: '  ' }), ev('b2', 'A', 5, 'customer.renamed', { from: 'نبود', to: 'x' })]).customers.length, 2) // blank / unknown: no-op
// customer delete: the name goes, the sales (revenue, profit, stock) stay
const gone2 = replay([...base, ev('d1', 'A', 5, 'customer.removed', { name: 'علي' })])
assert.deepEqual(gone2.customers.map((c) => c.name), ['سارا'])
assert.equal(gone2.sales.length, 3)
assert.equal(gone2.items.latte.profit, replay(base).items.latte.profit)
assert.deepEqual(gone2.sales.map((x) => x.customer), ['', 'سارا', ''])
assert.deepEqual(replay([...base, ev('d1', 'A', 5, 'customer.removed', { name: 'علی' }), sell('d2', 6, 1, { customer: 'علی' })]).customers.map((c) => c.name).sort(), ['سارا', 'علی'].sort()) // buys again later

// debts: a sale paid below its total opens a debt for the rest; no `paid` (or a quick sell) means paid in full
const debtBase = [
  created, // price 4
  sell('f1', 2, 3, { customer: 'علی' }),                          // paid in full by default
  sell('f2', 3, 5, { customer: 'سارا', paid: 8 }),                 // total 20, pays 8 -> owes 12
  sell('f3', 4, 2, { paid: 0 }),                                   // owes, but no customer: no debt
]
const d0 = replay(debtBase)
assert.deepEqual(d0.debts.map((d) => [d.id, d.customer, d.total, d.paidAtSale, d.remaining, d.kind]), [['f2', 'سارا', 20, 8, 12, 'sale']])
assert.deepEqual(d0.sales.map((x) => x.paid), [12, 8, 0]) // paid defaults to the full revenue; a customer-less unpaid sale records paid 0 but opens no debt
assert.equal(d0.items.latte.profit, replay(debtBase.map((e) => ({ ...e, data: [{ ...e.data[0], paid: undefined }] }))).items.latte.profit) // debts never change profit
// payments reduce the remaining; overpaying is floored at 0; a payment ordered before its debt (clock skew) still joins
const pay = (id, ts, debtId, amount, note) => ev(id, 'B', ts, 'debt.paid', { debtId, amount, ...(note && { note }) })
const paying = replay([...debtBase, pay('p1', 5, 'f2', 5, 'نقد'), pay('p0', 1, 'f2', 3)])
assert.deepEqual([paying.debts[0].paid, paying.debts[0].remaining, paying.debts[0].payments.map((x) => x.id)], [16, 4, ['p0', 'p1']])
assert.equal(paying.customers.find((c) => c.name === 'سارا').debt, 4)
const overpaid = replay([...debtBase, pay('p2', 5, 'f2', 50)])
assert.deepEqual([overpaid.debts[0].remaining, overpaid.customers.find((c) => c.name === 'سارا').debtOpen], [0, 0]) // settled
assert.equal(replay([...debtBase, pay('p3', 5, 'nope', 5), pay('p4', 6, 'f2', 0), pay('p5', 6, 'f2', -3)]).debts[0].remaining, 12) // unknown debt / zero / negative: ignored
// manual debt (no purchase), also for a customer with no sales: they still show up as a customer
const manual = replay([created, ev('m1', 'A', 2, 'debt.added', { customer: 'نیما', amount: 50, note: 'قدیمی' }), ev('m2', 'A', 3, 'debt.paid', { debtId: 'm1', amount: 20 })])
assert.deepEqual(manual.debts.map((d) => [d.kind, d.customer, d.total, d.remaining, d.note]), [['manual', 'نیما', 50, 30, 'قدیمی']])
assert.deepEqual(manual.customers.map((c) => [c.name, c.sales, c.debt, c.debtOpen]), [['نیما', 0, 30, 1]])
assert.equal(replay([created, ev('m3', 'A', 2, 'debt.added', { customer: '  ', amount: 5 }), ev('m4', 'A', 2, 'debt.added', { customer: 'x', amount: 0 })]).debts.length, 0)
// voiding: a sale takes its debt and payments with it; a voided payment restores the remaining; a voided manual debt vanishes
const voidOf = (id, vid) => ev(vid, 'A', 90, 'history.voided', { id })
assert.deepEqual(replay([...debtBase, pay('p1', 5, 'f2', 5), voidOf('f2', 'v1')]).debts, [])
assert.equal(replay([...debtBase, pay('p1', 5, 'f2', 5), voidOf('p1', 'v2')]).debts[0].remaining, 12)
assert.deepEqual(replay([created, ev('m1', 'A', 2, 'debt.added', { customer: 'نیما', amount: 50 }), voidOf('m1', 'v3')]).customers, [])
// customers: debts follow renames; removal clears the name; a debt keeps its own record
const ren = replay([...debtBase, ev('rn1', 'A', 6, 'customer.renamed', { from: 'سارا', to: 'سارا م' }), pay('p6', 7, 'f2', 2)])
assert.deepEqual([ren.debts[0].customer, ren.customers.find((c) => c.name === 'سارا م').debt], ['سارا م', 10])
const rem = replay([...debtBase, ev('rm1', 'A', 6, 'customer.removed', { name: 'سارا' })])
assert.deepEqual([rem.debts[0].customer, rem.customers.map((c) => c.name)], ['', ['علی']])

// general expenses: listed in time order, titles remembered (normalized, latest spelling), voidable
const exp = (id, ts, title, amount, note) => ev(id, 'A', ts, 'expense.added', { title, amount, ...(note && { note }) })
const costs = replay([
  created,
  exp('x1', 2, 'حقوق  کارمند', 5000000, 'مهر'),
  exp('x2', 3, 'اجاره', 8000000),
  exp('x3', 4, 'حقوق کارمند', 5200000), // same title, ZWNJ/space-insensitive: one remembered title
  exp('x4', 5, '  ', 100),             // blank title: ignored
  exp('x5', 6, 'قبض', 0),              // zero amount: ignored
])
assert.deepEqual(costs.expenses.map((e) => [e.id, e.amount, e.note]), [['x1', 5000000, 'مهر'], ['x2', 8000000, ''], ['x3', 5200000, '']])
assert.deepEqual(costs.expenseTitles.map((t) => [t.name, t.count, t.total]), [['حقوق کارمند', 2, 10200000], ['اجاره', 1, 8000000]])
const voidedCost = replay([created, exp('x1', 2, 'اجاره', 8000000), ev('xv', 'A', 3, 'history.voided', { id: 'x1' })])
assert.deepEqual([voidedCost.expenses, voidedCost.expenseTitles], [[], []]) // voiding the only use drops the title too
assert.deepEqual(replay([created]).expenses, []) // old logs: nothing changes
// expenses lower the net profit per period and in total; a period with only expenses still shows up
const t1 = new Date(2026, 9, 17, 12).getTime()
const rep2 = buildReport(
  [{ id: 'a', ts: t1, itemId: 'latte', title: 'Latte', qty: 2, price: 10, cost: 4, revenue: 20, profit: 12 }],
  'day',
  [{ id: 'e1', ts: t1 + 3600_000, title: 'اجاره', amount: 5 }, { id: 'e2', ts: t1 + 3 * DAY, title: 'برق', amount: 7 }],
)
assert.deepEqual(rep2.buckets.map((b) => [b.revenue, b.profit, b.expenses, net(b)]), [[20, 12, 5, 7], [0, 0, 7, -7]])
assert.deepEqual([rep2.totals.profit, rep2.totals.expenses, net(rep2.totals)], [12, 12, 0])
assert.equal(buildReport([], 'day').totals.expenses, 0)

// typed numbers: Persian/Arabic digits and separators
assert.equal(toNum('۲۰٬۰۰۰'), 20000)
assert.equal(toNum('٣٫٥'), 3.5)
assert.equal(toNum(''), 0)

console.log('selfcheck ok')
