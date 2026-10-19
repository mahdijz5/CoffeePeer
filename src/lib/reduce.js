/**
 * Pure reducer: merged event log -> items. Dedupes by event id, orders by
 * (timestamp, device, id) so every device derives the same state.
 * Stock is a sum of deltas, so concurrent offline edits always add up.
 */
export function replay(events) {
  const byId = new Map()
  for (const e of events) byId.set(e.id, e)
  const sorted = [...byId.values()].sort(
    (a, b) => a.timestamp - b.timestamp || (a.device || '').localeCompare(b.device || '') || a.id.localeCompare(b.id),
  )

  const items = {}
  for (const { op, data } of sorted) {
    const p = data[0] || {}
    switch (op) {
      case 'item.created':
        items[p.id] = { id: p.id, title: p.title || 'Unnamed', price: Number(p.price) || 0, stock: Number(p.stock) || 0 }
        break
      case 'item.updated': {
        const it = items[p.id]
        if (!it) break
        if (p.title !== undefined) it.title = p.title
        if (p.price !== undefined) it.price = Number(p.price) || 0
        break
      }
      case 'item.restocked':
        if (items[p.itemId]) items[p.itemId].stock += Number(p.quantity) || 0
        break
      case 'item.sold':
        if (items[p.itemId]) items[p.itemId].stock -= Number(p.quantity) || 0
        break
    }
  }
  return items
}
