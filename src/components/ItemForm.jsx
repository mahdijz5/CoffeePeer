import { useState } from 'react'
import { EventStore } from '../services/eventStore.js'

export default function ItemForm({ onClose }) {

  const [title, setTitle] = useState('')
  const [price, setPrice] = useState('')
  const [stock, setStock] = useState('0')

  const handleAdd = () => {
    if (!title.trim()) return

    const item = {
      title: title.trim(),
      price: parseFloat(price) || 0,
      stock: parseInt(stock, 10) || 0,
    }

    EventStore.addItem(item)
    setTitle('')
    setPrice('')
    setStock('0')
    onClose?.()
  }

  return (
    <section className="item-form">
      <h2>Add Item</h2>
      <input
        type="text"
        placeholder="Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <input
        type="number"
        placeholder="Price"
        value={price}
        onChange={(e) => setPrice(e.target.value)}
        step="0.01"
      />
      <input
        type="number"
        placeholder="Initial stock"
        value={stock}
        onChange={(e) => setStock(e.target.value)}
      />
      <button onClick={handleAdd}>Add</button>
    </section>
  )
}
