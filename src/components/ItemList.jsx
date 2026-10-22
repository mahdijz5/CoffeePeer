import { useEffect, useRef, useState } from 'react'
import { useStore } from '../store/index.js'
import { EventStore } from '../services/eventStore.js'
import { resizeToDataUrl } from '../lib/image.js'
import { fmtNum, fmtMoney } from '../lib/format.js'
import ItemAvatar from './ItemAvatar.jsx'
import ItemForm from './ItemForm.jsx'
import RestockForm from './RestockForm.jsx'
import SellForm from './SellForm.jsx'

const LOW_STOCK = 3
const UNDO_MS = 6000

export default function ItemList({ onAdd }) {
  const items = useStore((s) => s.items)
  const [editing, setEditing] = useState(null) // item being edited
  const [restocking, setRestocking] = useState(null) // item being restocked
  const [selling, setSelling] = useState(null) // item in the detailed-sell sheet
  const all = Object.values(items)
  const entries = all.filter((i) => !i.removed)
  const [undo, setUndo] = useState(null) // last sale/restock, offered for a few seconds: { id, text }
  const undoTimer = useRef(0)
  useEffect(() => () => clearTimeout(undoTimer.current), [])

  const offerUndo = (id, text) => {
    if (!id) return
    clearTimeout(undoTimer.current)
    setUndo({ id, text })
    undoTimer.current = setTimeout(() => setUndo(null), UNDO_MS)
  }

  const changeIcon = async (id, file) => {
    if (!file) return
    try {
      EventStore.updateItem({ id, icon: await resizeToDataUrl(file) })
    } catch {
      alert('خواندن این تصویر ممکن نبود')
    }
  }

  if (entries.length === 0) {
    return (
      <section className="empty">
        <div className="empty-cup">☕</div>
        <h2>هنوز کالایی ثبت نشده</h2>
        <p>اولین نوشیدنی یا خوراکی را اضافه کنید تا موجودی و سود را دنبال کنید.</p>
        <button className="btn primary" onClick={onAdd}>افزودن اولین کالا</button>
      </section>
    )
  }

  const units = entries.reduce((n, i) => n + Math.max(0, i.stock), 0)
  const low = entries.filter((i) => i.stock <= LOW_STOCK).length
  const profit = all.reduce((n, i) => n + i.profit, 0) // removed items still count: their sales stay in history

  return (
    <>
      <section className="stats">
        <div className="stat"><b>{fmtNum(entries.length)}</b><span>کالا</span></div>
        <div className="stat"><b>{fmtNum(units)}</b><span>موجودی کل</span></div>
        <div className={`stat ${low ? 'warn' : ''}`}><b>{fmtNum(low)}</b><span>کم یا تمام‌شده</span></div>
        <div className={`stat ${profit < 0 ? 'bad' : 'good'}`}><b>{fmtMoney(profit)}</b><span>سود کل</span></div>
      </section>

      <section className="grid">
        {entries.map((item, i) => {
          const level = item.stock <= 0 ? 'out' : item.stock <= LOW_STOCK ? 'low' : 'ok'
          const unitProfit = item.price - item.cost
          return (
            <article key={item.id} className="card" style={{ '--i': i }}>
              <div className="card-top">
                <label className="avatar-btn" title="تغییر آیکون">
                  <ItemAvatar title={item.title} icon={item.icon} />
                  <span className="avatar-edit" aria-hidden="true">✎</span>
                  <input
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={(e) => { changeIcon(item.id, e.target.files[0]); e.target.value = '' }}
                  />
                </label>
                <div className="card-info">
                  <h3>{item.title}</h3>
                  <div className="meta">{fmtMoney(item.price)}</div>
                  <div className="chips">
                    <span className={`chip ${unitProfit < 0 ? 'bad' : 'good'}`}>سود هر واحد {fmtNum(unitProfit)}</span>
                    {item.sold > 0 && <span className="chip">فروش {fmtNum(item.sold)}</span>}
                  </div>
                </div>
                <div className={`badge ${level}`}>
                  <span key={item.stock} className="pop">{fmtNum(item.stock)}</span>
                  <small>{level === 'out' ? 'تمام شد' : 'موجود'}</small>
                </div>
              </div>
              <div className="card-actions">
                <button className="btn primary grow" onClick={() => offerUndo(EventStore.sellItem(item.id), `فروش «${item.title}» ثبت شد`)}>فروش سریع</button>
                <button className="btn ghost" onClick={() => setSelling(item)} title="فروش با جزئیات">فروش</button>
                <button className="btn ghost" onClick={() => setRestocking(item)}>موجودی +</button>
                <button className="btn ghost icon" onClick={() => setEditing(item)} title="ویرایش" aria-label="ویرایش">✎</button>
              </div>
            </article>
          )
        })}
      </section>

      {undo && (
        <div className="toast" key={undo.id} style={{ '--ms': `${UNDO_MS}ms` }}>
          <span>{undo.text}</span>
          <button onClick={() => { EventStore.voidEntry(undo.id); setUndo(null) }}>بازگرداندن</button>
        </div>
      )}
      {editing && <ItemForm item={editing} onClose={() => setEditing(null)} />}
      {selling && (
        <SellForm
          item={selling}
          onSell={(qty, extra) => offerUndo(EventStore.sellItem(selling.id, qty, extra), `فروش ${fmtNum(qty)} عدد «${selling.title}» ثبت شد`)}
          onClose={() => setSelling(null)}
        />
      )}
      {restocking && <RestockForm
        item={restocking}
        onAdd={(qty) => offerUndo(EventStore.restockItem(restocking.id, qty), `${fmtNum(qty)} عدد به «${restocking.title}» اضافه شد`)}
        onClose={() => setRestocking(null)}
      />}
    </>
  )
}
