import { useState } from 'react'
import { EventStore } from '../services/eventStore.js'
import { resizeToDataUrl } from '../lib/image.js'
import { fmtNum, toNum } from '../lib/format.js'
import ItemAvatar from './ItemAvatar.jsx'
import Sheet from './Sheet.jsx'

/** Add an item, or edit one when `item` is given (stock changes go through restocks/sales). */
export default function ItemForm({ item, onClose }) {
  const [title, setTitle] = useState(item?.title ?? '')
  const [price, setPrice] = useState(item ? fmtNum(item.price) : '')
  const [cost, setCost] = useState(item ? fmtNum(item.cost) : '')
  const [stock, setStock] = useState(fmtNum(0))
  const [icon, setIcon] = useState(item?.icon ?? '')

  const pickIcon = async (file) => {
    if (!file) return
    try {
      setIcon(await resizeToDataUrl(file))
    } catch {
      alert('خواندن این تصویر ممکن نبود')
    }
  }

  const handleSave = (e) => {
    e.preventDefault()
    if (!title.trim()) return
    const next = { title: title.trim(), price: toNum(price), cost: toNum(cost), icon }
    if (!item) {
      EventStore.addItem({ ...next, stock: toNum(stock) })
    } else {
      // only send what changed, so concurrent edits of other fields on other phones survive.
      // Money fields are shown rounded, so compare rounded: an untouched average cost must not be overwritten.
      const same = (k, v) => (k === 'price' || k === 'cost' ? Math.round(v) === Math.round(item[k]) : v === item[k])
      const changes = Object.fromEntries(Object.entries(next).filter(([k, v]) => !same(k, v)))
      if (Object.keys(changes).length) EventStore.updateItem({ id: item.id, ...changes })
    }
    onClose()
  }

  const handleRemove = () => {
    if (!confirm(`«${item.title}» از لیست حذف شود؟\nتاریخچه فروش آن باقی می‌ماند.`)) return
    EventStore.removeItem(item.id)
    onClose()
  }

  return (
    <Sheet title={item ? 'ویرایش کالا' : 'کالای جدید'} onClose={onClose} onSubmit={handleSave}>
      <label className="icon-picker">
        <ItemAvatar title={title} icon={icon} className="big" />
        <span>{icon ? 'تغییر آیکون' : 'آپلود آیکون'}</span>
        <input type="file" accept="image/*" hidden onChange={(e) => pickIcon(e.target.files[0])} />
      </label>

      <label className="field">
        <span>نام</span>
        <input autoFocus dir="auto" placeholder="مثلاً اسپرسو" value={title} onChange={(e) => setTitle(e.target.value)} />
      </label>
      <div className="row">
        <label className="field">
          <span>قیمت فروش (تومان)</span>
          <input inputMode="decimal" placeholder="۰" value={price} onChange={(e) => setPrice(e.target.value)} />
        </label>
        <label className="field">
          <span>هزینه تولید هر واحد</span>
          <input inputMode="decimal" placeholder="۰" value={cost} onChange={(e) => setCost(e.target.value)} />
        </label>
      </div>
      {!item && (
        <label className="field">
          <span>موجودی اولیه</span>
          <input inputMode="numeric" value={stock} onChange={(e) => setStock(e.target.value)} />
        </label>
      )}
      <button className="btn primary" disabled={!title.trim()}>{item ? 'ذخیره' : 'افزودن کالا'}</button>
      {item && <button type="button" className="btn danger" onClick={handleRemove}>حذف کالا</button>}
    </Sheet>
  )
}
