import { useState } from 'react'
import { EventStore } from '../services/eventStore.js'
import { fmtNum, fmtMoney, fmtDateTime } from '../lib/format.js'

/** One debt: progress, remaining, pay button, and its payment history. Shared by the Debts tab and the customer report. */
export default function DebtCard({ debt, showCustomer = true, onPay }) {
  const [open, setOpen] = useState(false)
  const settled = debt.remaining <= 0
  const pct = debt.total ? Math.min(100, (debt.paid / debt.total) * 100) : 100
  const source = debt.kind === 'manual' ? 'بدهی دستی' : `${fmtNum(debt.qty)} × ${debt.title}`

  const voidIt = (id, text) => { if (confirm(text)) EventStore.voidEntry(id) }

  return (
    <article className={`dcard ${settled ? 'settled' : ''}`}>
      <div className="dhead">
        <div className="dtitle">
          {showCustomer && <b>{debt.customer || 'بدون نام'}</b>}
          <small>{source} · {fmtDateTime(debt.ts)}</small>
        </div>
        <span className={`chip ${settled ? 'good' : 'bad'}`}>{settled ? 'تسویه شد' : `مانده ${fmtMoney(debt.remaining)}`}</span>
      </div>
      {debt.note && <p className="note" dir="auto">📝 {debt.note}</p>}

      <div className="track" role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin="0" aria-valuemax="100"><i style={{ '--w': `${pct}%` }} /></div>
      <div className="dnums">
        <span>کل <b>{fmtMoney(debt.total)}</b></span>
        <span>پرداخت‌شده <b className="good">{fmtMoney(Math.min(debt.paid, debt.total))}</b></span>
      </div>

      <div className="dactions">
        {!settled && <button className="btn primary grow" onClick={() => onPay(debt)}>ثبت پرداخت</button>}
        <button className="btn ghost grow" onClick={() => setOpen(!open)} aria-expanded={open}>
          پرداخت‌ها ({fmtNum(debt.payments.length + (debt.paidAtSale > 0 ? 1 : 0))})
        </button>
        {debt.kind === 'manual' && (
          <button className="btn danger icon" title="حذف بدهی" aria-label="حذف بدهی"
            onClick={() => voidIt(debt.id, 'این بدهی حذف شود؟\nپرداخت‌های ثبت‌شده برای آن هم حذف می‌شوند.')}>🗑</button>
        )}
      </div>

      {open && (
        <ul className="plist">
          {debt.paidAtSale > 0 && <li><span>پرداخت هنگام خرید</span><b>{fmtMoney(debt.paidAtSale)}</b><i /></li>}
          {debt.payments.map((p) => (
            <li key={p.id}>
              <span>{fmtDateTime(p.ts)}{p.note && ` · ${p.note}`}</span>
              <b>{fmtMoney(p.amount)}</b>
              <button className="icon-btn danger" title="حذف پرداخت" aria-label="حذف پرداخت"
                onClick={() => voidIt(p.id, `پرداخت ${fmtMoney(p.amount)} حذف شود؟\nمبلغ دوباره به بدهی برمی‌گردد.`)}>🗑</button>
            </li>
          ))}
          {debt.payments.length === 0 && debt.paidAtSale <= 0 && <li className="muted"><span>هنوز پرداختی ثبت نشده.</span></li>}
          {debt.kind === 'sale' && <li className="muted hint"><span>این بدهی از یک فروش ساخته شده؛ با حذف آن فروش از تاریخچه، بدهی هم حذف می‌شود.</span></li>}
        </ul>
      )}
    </article>
  )
}
