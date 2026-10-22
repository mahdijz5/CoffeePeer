import { useStore } from '../store/index.js'
import { fmtNum, fmtMoney, fmtDate, fmtDateTime, normName } from '../lib/format.js'
import ItemAvatar from './ItemAvatar.jsx'
import Sheet from './Sheet.jsx'

/** Everything one customer bought: summary totals, then every sale with price, cost, profit and note. */
export default function CustomerDetail({ customer, onClose }) {
  const sales = useStore((s) => s.sales)
  const items = useStore((s) => s.items)

  const rows = sales.filter((s) => s.customer && normName(s.customer) === customer.key).reverse() // newest first
  const cost = rows.reduce((n, s) => n + s.qty * s.cost, 0)
  const summary = [
    ['تعداد فروش', fmtNum(customer.sales)],
    ['تعداد کالا', fmtNum(customer.units)],
    ['جمع خرید', fmtMoney(customer.revenue)],
    ['هزینه تولید', fmtMoney(cost)],
    ['سود', fmtMoney(customer.profit), customer.profit < 0 ? 'bad' : 'good'],
    ['میانگین هر فروش', fmtMoney(customer.sales ? customer.revenue / customer.sales : 0)],
  ]

  return (
    <Sheet wide title={`خریدهای ${customer.name}`} onClose={onClose} onSubmit={(e) => e.preventDefault()}>
      <div className="stats">
        {summary.map(([label, value, tone = '']) => (
          <div key={label} className={`stat ${tone}`}><b>{value}</b><span>{label}</span></div>
        ))}
      </div>
      <p className="muted">
        اولین خرید: {fmtDate(rows[rows.length - 1]?.ts ?? customer.lastTs)} · آخرین خرید: {fmtDate(customer.lastTs)}
      </p>

      <div className="rows">
        {rows.map((s) => (
          <article key={s.id} className="rowcard">
            <ItemAvatar title={s.title} icon={items[s.itemId]?.icon} className="small" />
            <div className="rowcard-main">
              <b>{s.title}</b>
              <small>{fmtDateTime(s.ts)}</small>
              <div className="chips">
                <span className="chip">{fmtNum(s.qty)} × {fmtNum(s.price)}</span>
                <span className="chip">هزینه واحد {fmtNum(s.cost)}</span>
                {s.paid < s.revenue && <span className="chip bad">نسیه {fmtNum(s.revenue - s.paid)}</span>}
              </div>
              {s.note && <p className="note" dir="auto">📝 {s.note}</p>}
            </div>
            <div className="rowcard-amount">
              <b>{fmtMoney(s.revenue)}</b>
              <small className={s.profit < 0 ? 'bad' : 'good'}>سود {fmtNum(s.profit)}</small>
            </div>
          </article>
        ))}
      </div>
    </Sheet>
  )
}
