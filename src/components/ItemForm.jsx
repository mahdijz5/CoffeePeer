import { useEffect, useState } from 'react'
import { EventStore } from '../services/eventStore.js'
import { resizeToDataUrl } from '../lib/image.js'
import ItemAvatar from './ItemAvatar.jsx'

/** Bottom-sheet modal for adding an item, with optional icon upload. */
export default function ItemForm({ onClose }) {
  const [title, setTitle] = useState('')
  const [price, setPrice] = useState('')
  const [stock, setStock] = useState('0')
  const [icon, setIcon] = useState('')

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const pickIcon = async (file) => {
    if (!file) return
    try {
      setIcon(await resizeToDataUrl(file))
    } catch {
      alert('Could not read that image')
    }
  }

  const handleAdd = (e) => {
    e.preventDefault()
    if (!title.trim()) return
    EventStore.addItem({
      title: title.trim(),
      price: parseFloat(price) || 0,
      stock: parseInt(stock, 10) || 0,
      icon,
    })
    onClose()
  }

  return (
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <form className="sheet" onSubmit={handleAdd}>
        <div className="sheet-head">
          <h2>New item</h2>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close">✕</button>
        </div>

        <label className="icon-picker">
          <ItemAvatar title={title} icon={icon} className="big" />
          <span>{icon ? 'Change icon' : 'Upload icon'}</span>
          <input type="file" accept="image/*" hidden onChange={(e) => pickIcon(e.target.files[0])} />
        </label>

        <input autoFocus dir="auto" placeholder="Name" value={title} onChange={(e) => setTitle(e.target.value)} />
        <div className="row">
          <input type="number" inputMode="decimal" placeholder="Price" value={price} onChange={(e) => setPrice(e.target.value)} step="any" />
          <input type="number" inputMode="numeric" placeholder="Initial stock" value={stock} onChange={(e) => setStock(e.target.value)} />
        </div>
        <button className="btn primary" disabled={!title.trim()}>Add item</button>
      </form>
    </div>
  )
}
