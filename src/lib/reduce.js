import { normName } from './format.js'

const n = (v) => Number(v) || 0

/**
 * Pure reducer: merged event log -> { items, sales, customers, debts, expenses, expenseTitles }.
 * Dedupes by event id and orders by (timestamp, device, id) so every device derives the same state.
 * Stock is a sum of deltas, so concurrent offline edits always add up.
 *
 * The shop makes its own items, so there are no purchases: `cost` is the item's production cost,
 * edited by hand. Each sale records the price and cost it was made at (events carry them; old
 * events fall back to the item's price/cost at that point of the replay), so later edits never
 * rewrite past profit.
 *
 * Removing an item only flags it (`removed`), so its sales stay in the history.
 * A history.voided event cancels one sale or restock as if it never happened. Voids are
 * collected first, so a phone with a wrong clock can't make a void arrive "before" its target.
 *
 * Customers are derived from the surviving sales (optional `customer` name on item.sold), matched by
 * normalized name, so voiding a sale also takes it out of that customer's totals. customer.renamed /
 * customer.removed rewrite the names of the sales made before them (events replay in time order), so a
 * sale logged later under the old name starts a customer again.
 *
 * Debts (نسیه): an item.sold with `paid` below its total (and a customer) opens a debt for the rest;
 * debt.added opens one by hand. debt.paid payments are joined to their debt after the loop, so event
 * order (a wrong phone clock) can't orphan them; voiding a sale/debt/payment removes it. Debtors with
 * no sales still count as customers.
 *
 * General costs (expense.added: title, amount, note) are listed in expenses; expenseTitles remembers each
 * distinct title (matched by normalized name, latest spelling) for the dropdown. Voiding an expense removes it
 * and, if it was the only one, that title.
 *
 * @returns {{ items: Record<string, object>, sales: object[], customers: object[], debts: object[],
 *   expenses: object[], expenseTitles: object[] }}
 */
export function replay(events) {
  const byId = new Map()
  for (const e of events) byId.set(e.id, e)
  const sorted = [...byId.values()].sort(
    (a, b) => a.timestamp - b.timestamp || (a.device || '').localeCompare(b.device || '') || a.id.localeCompare(b.id),
  )

  const voided = new Set(sorted.filter((e) => e.op === 'history.voided').map((e) => e.data[0]?.id))
  const items = {}
  const sales = []
  const debts = []
  const payments = []
  const expenses = []

  for (const { id: eid, op, data, timestamp: ts } of sorted) {
    const p = data[0] || {}
    switch (op) {
      case 'item.created':
        items[p.id] = {
          id: p.id, title: p.title || 'بدون نام', price: n(p.price), cost: n(p.cost), stock: n(p.stock), icon: p.icon || '',
          sold: 0, revenue: 0, profit: 0, // lifetime totals for this item
          removed: false,
        }
        break
      case 'item.updated': {
        const it = items[p.id]
        if (!it) break
        if (p.title !== undefined) it.title = p.title
        if (p.icon !== undefined) it.icon = p.icon
        if (p.price !== undefined) it.price = n(p.price)
        if (p.cost !== undefined) it.cost = n(p.cost)
        break
      }
      case 'customer.renamed': {
        const from = normName(p.from || '')
        const to = String(p.to || '').trim()
        if (!from || !normName(to)) break
        // also respell customers already named `to` (a merge), so the whole group shows the spelling just typed
        for (const s of [...sales, ...debts]) if (s.customer && [from, normName(to)].includes(normName(s.customer))) s.customer = to
        break
      }
      case 'customer.removed': {
        const key = normName(p.name || '')
        if (!key) break
        for (const s of [...sales, ...debts]) if (s.customer && normName(s.customer) === key) s.customer = ''
        break
      }
      case 'item.removed':
        if (items[p.id]) items[p.id].removed = true
        break
      case 'item.restocked': {
        const it = items[p.itemId]
        if (!it || voided.has(eid)) break
        it.stock += n(p.quantity) // old events may carry unitCost/supplier/note: ignored
        break
      }
      case 'item.sold': {
        const it = items[p.itemId]
        if (!it || voided.has(eid)) break
        const qty = n(p.quantity)
        const price = p.price === undefined ? it.price : n(p.price)
        const cost = p.cost === undefined ? it.cost : n(p.cost)
        it.stock -= qty
        it.sold += qty
        it.revenue += qty * price
        it.profit += qty * (price - cost)
        const revenue = qty * price
        const paid = p.paid === undefined ? revenue : Math.min(revenue, Math.max(0, n(p.paid))) // no `paid` = paid in full
        const sale = {
          id: eid, ts, itemId: it.id, title: it.title, qty, price, cost, revenue, profit: qty * (price - cost),
          paid, customer: String(p.customer || '').trim(), note: String(p.note || '').trim(),
        }
        sales.push(sale)
        if (paid < revenue && sale.customer) {
          debts.push({ id: eid, kind: 'sale', ts, customer: sale.customer, title: it.title, qty, note: sale.note, total: revenue, paidAtSale: paid })
        }
        break
      }
      case 'debt.added': {
        const customer = String(p.customer || '').trim()
        const amount = n(p.amount)
        if (voided.has(eid) || !customer || amount <= 0) break
        debts.push({ id: eid, kind: 'manual', ts, customer, title: '', qty: 0, note: String(p.note || '').trim(), total: amount, paidAtSale: 0 })
        break
      }
      case 'expense.added': {
        const title = String(p.title || '').trim()
        const amount = n(p.amount)
        if (voided.has(eid) || !title || amount <= 0) break
        expenses.push({ id: eid, ts, title, amount, note: String(p.note || '').trim() })
        break
      }
      case 'debt.paid':
        if (!voided.has(eid) && n(p.amount) > 0) payments.push({ id: eid, ts, debtId: p.debtId, amount: n(p.amount), note: String(p.note || '').trim() })
        break
    }
  }

  // join payments to their debts (payments for a voided/unknown debt are dropped)
  const byDebt = new Map(debts.map((d) => [d.id, d]))
  for (const d of debts) d.payments = []
  for (const pm of payments) byDebt.get(pm.debtId)?.payments.push(pm)
  for (const d of debts) {
    d.paid = d.paidAtSale + d.payments.reduce((sum, pm) => sum + pm.amount, 0)
    d.remaining = Math.max(0, d.total - d.paid) // two phones paying at once can overshoot: shown as settled
  }

  // one entry per normalized customer name (from sales and debts); the latest spelling is the display name
  const byCustomer = new Map()
  const customerOf = (name, ts) => {
    const key = normName(name)
    const c = byCustomer.get(key) || { key, name, sales: 0, units: 0, revenue: 0, profit: 0, lastTs: 0, debt: 0, debtOpen: 0 }
    if (ts >= c.lastTs) { c.lastTs = ts; c.name = name }
    byCustomer.set(key, c)
    return c
  }
  for (const s of sales) {
    if (!s.customer) continue
    const c = customerOf(s.customer, s.ts)
    c.sales += 1
    c.units += s.qty
    c.revenue += s.revenue
    c.profit += s.profit
  }
  for (const d of debts) {
    if (!d.customer) continue
    const c = customerOf(d.customer, d.ts)
    if (d.remaining > 0) { c.debt += d.remaining; c.debtOpen += 1 }
  }
  const customers = [...byCustomer.values()].sort((a, b) => b.lastTs - a.lastTs)

  // remembered expense titles: one per normalized title, latest spelling, with usage totals
  const byTitle = new Map()
  for (const e of expenses) {
    const key = normName(e.title)
    const t = byTitle.get(key) || { key, name: e.title, count: 0, total: 0, lastTs: 0 }
    t.count += 1
    t.total += e.amount
    if (e.ts >= t.lastTs) { t.lastTs = e.ts; t.name = e.title }
    byTitle.set(key, t)
  }
  const expenseTitles = [...byTitle.values()].sort((a, b) => b.lastTs - a.lastTs)

  return { items, sales, customers, debts, expenses, expenseTitles }
}
