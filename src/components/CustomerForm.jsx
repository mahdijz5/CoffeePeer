import { useState } from 'react'
import { useStore } from '../store/index.js'
import { EventStore } from '../services/eventStore.js'
import { normName } from '../lib/format.js'
import Sheet from './Sheet.jsx'

/** Rename a customer. A name that belongs to another customer merges the two. */
export default function CustomerForm({ customer, onClose }) {
  const customers = useStore((s) => s.customers)
  const [name, setName] = useState(customer.name)

  const trimmed = name.trim()
  const merges = customers.some((c) => c.key !== customer.key && c.key === normName(trimmed))
  const changed = trimmed !== customer.name

  const handleSave = (e) => {
    e.preventDefault()
    if (!trimmed || !changed) return
    EventStore.renameCustomer(customer.name, trimmed)
    onClose()
  }

  return (
    <Sheet title="ویرایش مشتری" onClose={onClose} onSubmit={handleSave}>
      <label className="field">
        <span>نام مشتری</span>
        <input autoFocus dir="auto" value={name} onChange={(e) => setName(e.target.value)} />
      </label>
      <p className="muted">نام در تمام فروش‌های قبلی این مشتری هم تغییر می‌کند.</p>
      {merges && <p className="warn">این نام برای مشتری دیگری است؛ هر دو مشتری با هم ادغام می‌شوند.</p>}
      <button className="btn primary" disabled={!trimmed || !changed}>{merges ? 'ادغام و ذخیره' : 'ذخیره'}</button>
    </Sheet>
  )
}
