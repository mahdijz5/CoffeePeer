import { useState } from 'react'
import { EventStore } from '../services/eventStore.js'
import { fmtNum, fmtMoney, toNum } from '../lib/format.js'
import Sheet from './Sheet.jsx'

/** Record a payment against one debt; the amount defaults to (and is capped at) what is still owed. */
export default function PayDebtForm({ debt, onClose }) {
  const [amount, setAmount] = useState(fmtNum(debt.remaining))
  const [note, setNote] = useState('')

  const typed = toNum(amount)
  const pay = Math.min(typed, debt.remaining)
  const left = debt.remaining - Math.max(0, pay)

  const handleSave = (e) => {
    e.preventDefault()
    if (pay <= 0) return
    EventStore.payDebt(debt.id, pay, note)
    onClose()
  }

  return (
    <Sheet title="ثبت پرداخت" onClose={onClose} onSubmit={handleSave}>
      <p className="muted">{debt.customer} · مانده بدهی <b>{fmtMoney(debt.remaining)}</b></p>
      <label className="field">
        <span>مبلغ پرداختی (تومان)</span>
        <input autoFocus inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} />
      </label>
      {typed > debt.remaining && <p className="warn">بیشتر از مانده بدهی است؛ فقط {fmtMoney(debt.remaining)} ثبت می‌شود.</p>}
      <label className="field">
        <span>یادداشت (اختیاری)</span>
        <input dir="auto" placeholder="مثلاً کارت به کارت" value={note} onChange={(e) => setNote(e.target.value)} />
      </label>
      <div className="total"><span>مانده پس از پرداخت</span><b>{fmtMoney(left)}</b></div>
      <button className="btn primary" disabled={pay <= 0}>ثبت پرداخت</button>
    </Sheet>
  )
}
