import { useStore } from '../store/index.js'
import { EventStore } from '../services/eventStore.js'

export default function ItemList() {
  const items = useStore((s) => s.items)

  const addItem = (id) => {
    const current = items[id]
    if (!current) return
    EventStore.updateItem({ id, stock: current.stock + 1 })
  }

  const updatePrice = (id) => {
    const current = items[id]
    if (!current) return
    EventStore.updateItem({ id, price: current.price + 0.5 })
  }

  const sellItem = (id) => {
    EventStore.sellItem(id)
  }

  if (!items) return <p>No items yet</p>

  const entries = Object.values(items)

  return (
    <section className="item-list">
      <h2>Inventory</h2>
      {entries.length === 0 ? (
        <p>No items yet. Use the form below to add some.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Title</th>
              <th>Price</th>
              <th>Stock</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((item) => (
              <tr key={item.id}>
                <td>{item.title}</td>
                <td>${item.price.toFixed(2)}</td>
                <td style={{ color: item.stock <= 0 ? '#ef4444' : 'inherit' }}>
                  {item.stock}
                </td>
                <td>
                  <button onClick={() => addItem(item.id)}>+1</button>
                  <button onClick={() => updatePrice(item.id)}>+0.5</button>
                  <button onClick={() => sellItem(item.id)}>Sell</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  )
}
