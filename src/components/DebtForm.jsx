import { useState } from 'react'
import { EventStore } from '../services/eventStore.js'
import { toNum } from '../lib/format.js'
import CustomerInput from './CustomerInput.jsx'
import Sheet from './Sheet.jsx'

/** A debt without a purchase. `customer` pre-fills the name (opened from a customer's report). */
export default function DebtForm({ customer = '', onClose }) {
  const [name, setName] = useState(customer)
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')

  const value = toNum(amount)
  const ok = name.trim() && value > 0

  const handleSave = (e) => {
    e.preventDefault()
    if (!ok) return
    EventStore.addDebt({ customer: name, amount: value, note })
    onClose()
  }

  return (
    <Sheet title="بدهی دستی" onClose={onClose} onSubmit={handleSave}>
      <div className="field">
        <span>مشتری</span>
        <CustomerInput value={name} onChange={setName} placeholder="نام مشتری" />
      </div>
      <label className="field">
        <span>مبلغ بدهی (تومان)</span>
        <input autoFocus={!!customer} inputMode="decimal" placeholder="۰" value={amount} onChange={(e) => setAmount(e.target.value)} />
      </label>
      <label className="field">
        <span>یادداشت (اختیاری)</span>
        <input dir="auto" value={note} onChange={(e) => setNote(e.target.value)} />
      </label>
      <button className="btn primary" disabled={!ok}>ثبت بدهی</button>
    </Sheet>
  )
}
