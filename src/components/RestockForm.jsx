import { useState } from 'react'
import { fmtNum, toNum } from '../lib/format.js'
import ItemAvatar from './ItemAvatar.jsx'
import Sheet from './Sheet.jsx'

/** Add stock you made: just a quantity (cost lives on the item). */
export default function RestockForm({ item, onAdd, onClose }) {
  const [qty, setQty] = useState(fmtNum(1))
  const quantity = toNum(qty)

  const handleSave = (e) => {
    e.preventDefault()
    if (quantity <= 0) return
    onAdd(quantity)
    onClose()
  }

  return (
    <Sheet title="افزودن موجودی" onClose={onClose} onSubmit={handleSave}>
      <div className="sheet-item">
        <ItemAvatar title={item.title} icon={item.icon} />
        <b dir="auto">{item.title}</b>
      </div>
      <label className="field">
        <span>تعداد</span>
        <input autoFocus inputMode="numeric" value={qty} onChange={(e) => setQty(e.target.value)} />
      </label>
      <button className="btn primary" disabled={quantity <= 0}>افزودن</button>
    </Sheet>
  )
}
