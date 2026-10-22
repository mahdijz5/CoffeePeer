// Daily / weekly / monthly (Jalali) report buckets from the derived sales.
const jalaliParts = new Intl.DateTimeFormat('en-u-ca-persian', { year: 'numeric', month: 'numeric', day: 'numeric' })
const dayLabel = new Intl.DateTimeFormat('fa-IR-u-ca-persian', { day: 'numeric', month: 'long' })
const monthLabel = new Intl.DateTimeFormat('fa-IR-u-ca-persian', { month: 'long', year: 'numeric' })

/** Persian week starts on Saturday. */
const weekStart = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate() - ((d.getDay() + 1) % 7))

/** @param {'day'|'week'|'month'} period */
export function bucketOf(ts, period) {
  const d = new Date(ts)
  if (period === 'month') {
    const parts = Object.fromEntries(jalaliParts.formatToParts(ts).map((p) => [p.type, p.value]))
    return { key: `${parts.year}-${parts.month}`, label: monthLabel.format(ts) }
  }
  if (period === 'week') {
    const start = weekStart(d)
    return { key: String(+start), label: `هفته‌ی ${dayLabel.format(start)}` }
  }
  const day = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  return { key: String(+day), label: dayLabel.format(day) }
}

const empty = () => ({ revenue: 0, cogs: 0, profit: 0, units: 0, byItem: {} })

function addSale(b, s) {
  b.revenue += s.revenue
  b.cogs += s.qty * s.cost
  b.profit += s.profit
  b.units += s.qty
  const it = (b.byItem[s.itemId] ??= { itemId: s.itemId, title: s.title, units: 0, revenue: 0, profit: 0 })
  it.units += s.qty
  it.revenue += s.revenue
  it.profit += s.profit
}

/** Chronological buckets (only periods with activity) plus overall totals. */
export function buildReport(sales, period) {
  const map = new Map()
  const bucket = (ts) => {
    const { key, label } = bucketOf(ts, period)
    let b = map.get(key)
    if (!b) map.set(key, (b = { key, label, ts, ...empty() }))
    b.ts = Math.min(b.ts, ts)
    return b
  }
  const totals = empty()
  for (const s of sales) { addSale(bucket(s.ts), s); addSale(totals, s) }
  const buckets = [...map.values()].sort((a, b) => a.ts - b.ts)
  return { buckets, totals }
}

export const margin = (b) => (b.revenue ? (b.profit / b.revenue) * 100 : 0)
export const topItems = (b, count = 5) => Object.values(b.byItem).sort((a, c) => c.profit - a.profit).slice(0, count)
