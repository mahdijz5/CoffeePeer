import { useState } from 'react'
import { useStore } from '../store/index.js'
import { EventStore } from '../services/eventStore.js'
import { toNum } from '../lib/format.js'
import ComboInput from './ComboInput.jsx'
import Sheet from './Sheet.jsx'

/** A general cost (salary, rent, bills...): title (remembered and suggested), amount, optional note. */
export default function ExpenseForm({ onClose }) {
  const titles = useStore((s) => s.expenseTitles)
  const [title, setTitle] = useState('')
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')

  const value = toNum(amount)
  const ok = title.trim() && value > 0

  const handleSave = (e) => {
    e.preventDefault()
    if (!ok) return
    EventStore.addExpense({ title, amount: value, note })
    onClose()
  }

  return (
    <Sheet title="هزینه جدید" onClose={onClose} onSubmit={handleSave}>
      <div className="field">
        <span>عنوان</span>
        <ComboInput
          autoFocus
          value={title}
          onChange={setTitle}
          options={titles}
          placeholder="مثلاً حقوق کارمند"
          newLabel={(text) => `عنوان جدید «${text}» ذخیره می‌شود`}
        />
      </div>
      <label className="field">
        <span>مبلغ (تومان)</span>
        <input inputMode="decimal" placeholder="۰" value={amount} onChange={(e) => setAmount(e.target.value)} />
      </label>
      <label className="field">
        <span>یادداشت (اختیاری)</span>
        <input dir="auto" placeholder="مثلاً حقوق مهر ماه" value={note} onChange={(e) => setNote(e.target.value)} />
      </label>
      <button className="btn primary" disabled={!ok}>ثبت هزینه</button>
    </Sheet>
  )
}
