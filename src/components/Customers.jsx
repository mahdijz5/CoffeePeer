import { useState } from 'react'
import { useStore } from '../store/index.js'
import { fmtNum, fmtMoney, fmtDate, normName } from '../lib/format.js'
import { EventStore } from '../services/eventStore.js'
import ItemAvatar from './ItemAvatar.jsx'
import CustomerDetail from './CustomerDetail.jsx'
import CustomerForm from './CustomerForm.jsx'
import CustomerDebts from './CustomerDebts.jsx'

/** Customers saved automatically from detailed sales, with totals. */
export default function Customers() {
  const customers = useStore((s) => s.customers)
  const [search, setSearch] = useState('')
  const [viewing, setViewing] = useState(null) // customer whose purchases are open
  const [editing, setEditing] = useState(null) // customer being renamed
  const [debting, setDebting] = useState(null) // customer whose debt report is open

  const remove = (c) => {
    if (c.debt > 0) { alert(`«${c.name}» ${fmtMoney(c.debt)} بدهی تسویه‌نشده دارد.\nابتدا بدهی را تسویه کنید (یا حذف کنید).`); return }
    if (confirm(`مشتری «${c.name}» حذف شود؟\nفروش‌های او در تاریخچه و گزارش‌ها باقی می‌ماند، فقط نامش از آن‌ها برداشته می‌شود.`)) EventStore.removeCustomer(c.name)
  }

  const q = normName(search)
  const rows = q ? customers.filter((c) => c.key.includes(q)) : customers

  if (customers.length === 0) {
    return (
      <section className="empty">
        <div className="empty-cup">👥</div>
        <h2>هنوز مشتری‌ای ثبت نشده</h2>
        <p>هنگام «فروش با جزئیات» نام مشتری را بنویسید تا اینجا ذخیره شود.</p>
      </section>
    )
  }

  return (
    <section>
      <input className="search" dir="auto" placeholder="جستجوی مشتری…" value={search} onChange={(e) => setSearch(e.target.value)} />
      <div className="rows">
        {rows.map((c, i) => (
          <article key={c.key} className="rowcard cust" style={{ '--i': Math.min(i, 12) }}>
            <ItemAvatar title={c.name} className="small" />
            <div className="rowcard-main">
              <b>{c.name}</b>
              <small>آخرین خرید: {fmtDate(c.lastTs)}</small>
              <div className="chips">
                <span className="chip">{fmtNum(c.sales)} فروش</span>
                <span className="chip">{fmtNum(c.units)} عدد</span>
                {c.debt > 0 && <span className="chip bad">بدهی {fmtMoney(c.debt)}</span>}
              </div>
            </div>
            <div className="rowcard-amount">
              <b>{fmtMoney(c.revenue)}</b>
              <small className={c.profit < 0 ? 'bad' : 'good'}>سود {fmtNum(c.profit)}</small>
            </div>
            <div className="cust-actions">
              <button className="btn ghost grow" onClick={() => setViewing(c)}>جزئیات خرید</button>
              <button className="btn ghost grow" onClick={() => setDebting(c)}>بدهی‌ها</button>
              <button className="btn ghost icon" onClick={() => setEditing(c)} title="ویرایش" aria-label="ویرایش">✎</button>
              <button className="btn danger icon" onClick={() => remove(c)} title="حذف" aria-label="حذف">🗑</button>
            </div>
          </article>
        ))}
      </div>
      {rows.length === 0 && <p className="muted center">مشتری‌ای با این نام پیدا نشد.</p>}
      {viewing && <CustomerDetail customer={customers.find((c) => c.key === viewing.key) || viewing} onClose={() => setViewing(null)} />}
      {editing && <CustomerForm customer={editing} onClose={() => setEditing(null)} />}
      {debting && <CustomerDebts customer={customers.find((c) => c.key === debting.key) || debting} onClose={() => setDebting(null)} />}
    </section>
  )
}
