import { useStore } from '../store/index.js'
import { EventStore } from '../services/eventStore.js'
import { resizeToDataUrl } from '../lib/image.js'
import ItemAvatar from './ItemAvatar.jsx'

const LOW_STOCK = 3
const fmt = new Intl.NumberFormat()

export default function ItemList({ onAdd }) {
  const items = useStore((s) => s.items)
  const entries = Object.values(items)

  const changeIcon = async (id, file) => {
    if (!file) return
    try {
      EventStore.updateItem({ id, icon: await resizeToDataUrl(file) })
    } catch {
      alert('Could not read that image')
    }
  }

  const editPrice = (item) => {
    const next = parseFloat(prompt(`New price for ${item.title}`, item.price))
    if (Number.isFinite(next) && next !== item.price) EventStore.updateItem({ id: item.id, price: next })
  }

  if (entries.length === 0) {
    return (
      <section className="empty">
        <div className="empty-cup">☕</div>
        <h2>No items yet</h2>
        <p>Add your first drink or snack to start tracking stock.</p>
        <button className="btn primary" onClick={onAdd}>Add first item</button>
      </section>
    )
  }

  const units = entries.reduce((n, i) => n + Math.max(0, i.stock), 0)
  const low = entries.filter((i) => i.stock <= LOW_STOCK).length

  return (
    <>
      <section className="stats">
        <div className="stat"><b>{entries.length}</b><span>Items</span></div>
        <div className="stat"><b>{fmt.format(units)}</b><span>In stock</span></div>
        <div className={`stat ${low ? 'warn' : ''}`}><b>{low}</b><span>Low or out</span></div>
      </section>

      <section className="grid">
        {entries.map((item, i) => {
          const level = item.stock <= 0 ? 'out' : item.stock <= LOW_STOCK ? 'low' : 'ok'
          return (
            <article key={item.id} className="card" style={{ '--i': i }}>
              <div className="card-top">
                <label className="avatar-btn" title="Change icon">
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
                  <h3 dir="auto">{item.title}</h3>
                  <button className="price" onClick={() => editPrice(item)} title="Edit price">{fmt.format(item.price)}</button>
                </div>
                <div className={`badge ${level}`}>
                  <span key={item.stock} className="pop">{item.stock}</span>
                  <small>{level === 'out' ? 'out' : 'left'}</small>
                </div>
              </div>
              <div className="card-actions">
                <button className="btn primary grow" onClick={() => EventStore.sellItem(item.id)}>Sell</button>
                <button className="btn ghost" onClick={() => EventStore.restockItem(item.id)} title="Restock +1">+1</button>
              </div>
            </article>
          )
        })}
      </section>
    </>
  )
}
