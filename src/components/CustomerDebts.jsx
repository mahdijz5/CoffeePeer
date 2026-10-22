import { useState } from 'react'
import { useStore } from '../store/index.js'
import { fmtNum, fmtMoney, normName } from '../lib/format.js'
import DebtCard from './DebtCard.jsx'
import PayDebtForm from './PayDebtForm.jsx'
import DebtForm from './DebtForm.jsx'
import Sheet from './Sheet.jsx'

/** Total debt report of one customer: totals, then each of their debts (settled ones too) with its payments. */
export default function CustomerDebts({ customer, onClose }) {
  const all = useStore((s) => s.debts)
  const [paying, setPaying] = useState(null)
  const [adding, setAdding] = useState(false)

  const debts = all.filter((d) => normName(d.customer) === customer.key).sort((a, b) => b.ts - a.ts)
  const total = debts.reduce((n, d) => n + d.total, 0)
  const remaining = debts.reduce((n, d) => n + d.remaining, 0)
  const summary = [
    ['مانده بدهی', fmtMoney(remaining), remaining > 0 ? 'bad' : 'good'], // first = full-width row
    ['جمع بدهی‌ها', fmtMoney(total)],
    ['پرداخت‌شده', fmtMoney(total - remaining), 'good'],
    ['تعداد بدهی', fmtNum(debts.length)],
    ['بدهی باز', fmtNum(debts.filter((d) => d.remaining > 0).length)],
  ]

  return (
    <>
      <Sheet wide title={`بدهی‌های ${customer.name}`} onClose={onClose} onSubmit={(e) => e.preventDefault()}>
        <div className="stats debts">
          {summary.map(([label, value, tone = '']) => (
            <div key={label} className={`stat ${tone}`}><b>{value}</b><span>{label}</span></div>
          ))}
        </div>
        <button type="button" className="btn ghost" onClick={() => setAdding(true)}>+ بدهی دستی جدید</button>
        {debts.length === 0 ? (
          <p className="muted center">این مشتری بدهی‌ای ندارد.</p>
        ) : (
          <div className="rows">{debts.map((d) => <DebtCard key={d.id} debt={d} showCustomer={false} onPay={setPaying} />)}</div>
        )}
      </Sheet>
      {paying && <PayDebtForm debt={all.find((d) => d.id === paying.id) || paying} onClose={() => setPaying(null)} />}
      {adding && <DebtForm customer={customer.name} onClose={() => setAdding(false)} />}
    </>
  )
}
