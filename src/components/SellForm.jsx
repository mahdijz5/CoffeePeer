import { useState } from 'react'
import { fmtNum, fmtMoney, toNum } from '../lib/format.js'
import ItemAvatar from './ItemAvatar.jsx'
import CustomerInput from './CustomerInput.jsx'
import Sheet from './Sheet.jsx'

/**
 * Sell: count, optional customer (autocompleted from past customers), amount paid and note.
 * Paid defaults to the full total (and follows the count) until the user types an amount; paying
 * less than the total records the rest as that customer's debt, so a customer name is then required.
 */
export default function SellForm({ item, onSell, onClose }) {
  const [qty, setQty] = useState(fmtNum(1))
  const [customer, setCustomer] = useState('')
  const [note, setNote] = useState('')
  const [paidText, setPaidText] = useState(null) // null = follow the total

  const quantity = toNum(qty)
  const over = quantity > item.stock // allowed (stock may go negative, like elsewhere), but flagged
  const total = quantity * item.price
  const paid = paidText === null ? total : Math.min(total, Math.max(0, toNum(paidText)))
  const owed = total - paid
  const needsCustomer = owed > 0 && !customer.trim()

  const handleSave = (e) => {
    e.preventDefault()
    if (quantity <= 0 || needsCustomer) return
    onSell(quantity, { customer, note, paid })
    onClose()
  }

  return (
    <Sheet title="فروش" onClose={onClose} onSubmit={handleSave}>
      <div className="sheet-item">
        <ItemAvatar title={item.title} icon={item.icon} />
        <div>
          <b dir="auto">{item.title}</b>
          <div className={`meta ${over ? 'bad' : ''}`}>موجودی: {fmtNum(item.stock)}</div>
        </div>
      </div>
      <label className="field">
        <span>تعداد</span>
        <input autoFocus inputMode="numeric" value={qty} onChange={(e) => setQty(e.target.value)} />
      </label>
      <div className="field">
        <span>مشتری (اختیاری)</span>
        <CustomerInput value={customer} onChange={setCustomer} />
      </div>
      <label className="field">
        <span>مبلغ پرداخت‌شده (تومان)</span>
        <input inputMode="decimal" value={paidText ?? fmtNum(total)} onChange={(e) => setPaidText(e.target.value)} />
      </label>
      <label className="field">
        <span>یادداشت (اختیاری)</span>
        <input dir="auto" value={note} onChange={(e) => setNote(e.target.value)} />
      </label>
      <div className="total">
        <span>جمع فروش</span>
        <b>{fmtMoney(total)} <small className={item.price - item.cost < 0 ? 'bad' : 'good'}>(سود {fmtNum(quantity * (item.price - item.cost))})</small></b>
      </div>
      {owed > 0 && (
        <p className={needsCustomer ? 'warn' : 'muted'}>
          {needsCustomer ? 'برای ثبت بدهی، نام مشتری را وارد کنید.' : `${fmtMoney(owed)} به‌عنوان بدهی «${customer.trim()}» ثبت می‌شود.`}
        </p>
      )}
      <button className="btn primary" disabled={quantity <= 0 || needsCustomer}>ثبت فروش</button>
    </Sheet>
  )
}
