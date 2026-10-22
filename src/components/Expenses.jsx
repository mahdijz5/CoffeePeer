import { useState } from 'react'
import { useStore } from '../store/index.js'
import { EventStore } from '../services/eventStore.js'
import { bucketOf } from '../lib/reports.js'
import { fmtNum, fmtMoney, fmtDateTime } from '../lib/format.js'
import ExpenseForm from './ExpenseForm.jsx'

const PAGE = 40

/** General costs (salary, rent, bills...), newest first, with totals. Deleting a row cancels that expense. */
export default function Expenses() {
  const expenses = useStore((s) => s.expenses)
  const [adding, setAdding] = useState(false)
  const [shown, setShown] = useState(PAGE)
  const [now] = useState(() => Date.now()) // "this month" is fixed per visit, which is fine here
  const [openNotes, setOpenNotes] = useState(() => new Set())
  const toggleNote = (id) => setOpenNotes((s) => { const n = new Set(s); if (!n.delete(id)) n.add(id); return n })

  const rows = [...expenses].reverse()
  const total = expenses.reduce((n, e) => n + e.amount, 0)
  const thisMonth = bucketOf(now, 'month').key
  const month = expenses.filter((e) => bucketOf(e.ts, 'month').key === thisMonth).reduce((n, e) => n + e.amount, 0)

  const remove = (e) => {
    if (confirm(`هزینه «${e.title}» (${fmtMoney(e.amount)}) حذف شود؟\nاز گزارش‌ها و سود خالص هم کم می‌شود.`)) EventStore.voidEntry(e.id)
  }

  return (
    <section>
      <div className="stats expenses">
        <div className="stat"><b>{fmtMoney(month)}</b><span>این ماه</span></div>
        <div className="stat"><b>{fmtMoney(total)}</b><span>جمع همه ({fmtNum(expenses.length)})</span></div>
      </div>
      <button className="btn primary wide-btn" onClick={() => setAdding(true)}>+ هزینه جدید</button>

      {rows.length === 0 ? (
        <p className="muted center">هنوز هزینه‌ای ثبت نشده. هزینه‌های عمومی مثل حقوق، اجاره و قبوض را اینجا بنویسید.</p>
      ) : (
        <div className="rows">
          {rows.slice(0, shown).map((e, i) => (
            <article key={e.id} className="rowcard" style={{ '--i': Math.min(i, 12) }}>
              <div className="rowcard-main">
                <b>{e.title}</b>
                <small>{fmtDateTime(e.ts)}</small>
                {e.note && (
                  <div className="chips">
                    <button className="chip note-btn" aria-expanded={openNotes.has(e.id)} onClick={() => toggleNote(e.id)}>📝 یادداشت</button>
                  </div>
                )}
                {e.note && openNotes.has(e.id) && <p className="note" dir="auto">{e.note}</p>}
              </div>
              <div className="rowcard-amount"><b className="bad">{fmtMoney(e.amount)}</b></div>
              <button className="icon-btn danger" onClick={() => remove(e)} title="حذف" aria-label="حذف">🗑</button>
            </article>
          ))}
        </div>
      )}
      {rows.length > shown && <button className="btn ghost more" onClick={() => setShown(shown + PAGE)}>نمایش بیشتر</button>}
      {adding && <ExpenseForm onClose={() => setAdding(false)} />}
    </section>
  )
}
