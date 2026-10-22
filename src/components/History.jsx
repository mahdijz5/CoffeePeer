import { useState } from 'react'
import { EventStore } from '../services/eventStore.js'
import { useStore } from '../store/index.js'
import { fmtNum, fmtMoney, fmtDateTime } from '../lib/format.js'
import ItemAvatar from './ItemAvatar.jsx'

const PAGE = 40

/** Sales history, newest first. Deleting a row cancels that sale (stock back, profit removed). */
export default function History() {
  const sales = useStore((s) => s.sales)
  const items = useStore((s) => s.items)
  const [shown, setShown] = useState(PAGE)
  const [openNotes, setOpenNotes] = useState(() => new Set()) // sale ids whose note is expanded
  const toggleNote = (id) => setOpenNotes((s) => { const n = new Set(s); if (!n.delete(id)) n.add(id); return n })

  const rows = [...sales].reverse()

  const remove = (r) => {
    if (confirm(`فروش «${r.title}» حذف شود؟\nموجودی برمی‌گردد و از سود و گزارش‌ها کم می‌شود.`)) EventStore.voidEntry(r.id)
  }

  if (rows.length === 0) return <p className="muted center">هنوز فروشی ثبت نشده.</p>

  return (
    <section>
      <h2 className="sect">تاریخچه فروش</h2>
      <div className="rows">
        {rows.slice(0, shown).map((r, i) => (
          <article key={r.id} className="rowcard" style={{ '--i': Math.min(i, 12) }}>
            <ItemAvatar title={r.title} icon={items[r.itemId]?.icon} className="small" />
            <div className="rowcard-main">
              <b>{r.title}</b>
              <small>{fmtDateTime(r.ts)}</small>
              <div className="chips">
                <span className="chip">{fmtNum(r.qty)} × {fmtNum(r.price)}</span>
                {r.customer && <span className="chip">👤 {r.customer}</span>}
                {r.customer && r.paid < r.revenue && <span className="chip bad">نسیه {fmtNum(r.revenue - r.paid)}</span>}
                {r.note && (
                  <button className="chip note-btn" aria-expanded={openNotes.has(r.id)} onClick={() => toggleNote(r.id)}>📝 یادداشت</button>
                )}
              </div>
              {r.note && openNotes.has(r.id) && <p className="note" dir="auto">{r.note}</p>}
            </div>
            <div className="rowcard-amount">
              <b>{fmtMoney(r.revenue)}</b>
              <small className={r.profit < 0 ? 'bad' : 'good'}>سود {fmtNum(r.profit)}</small>
            </div>
            <button className="icon-btn danger" onClick={() => remove(r)} title="حذف" aria-label="حذف">🗑</button>
          </article>
        ))}
      </div>
      {rows.length > shown && <button className="btn ghost more" onClick={() => setShown(shown + PAGE)}>نمایش بیشتر</button>}
    </section>
  )
}
